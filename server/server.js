import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import contactRouter from './routes/contact.js';
import projectsRouter from './routes/projects.js';
import githubProjectsRouter from './routes/githubProjects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;
// Strict CORS allowlist: dev + production origins, plus any extras from CLIENT_ORIGIN (comma-separated).
const ALLOWED_ORIGINS = new Set(
  ['http://localhost:5173', 'https://shanmukhaaditya-portfolio.vercel.app', ...(process.env.CLIENT_ORIGIN || '').split(',')]
    .map((o) => o.trim())
    .filter(Boolean)
);

// Fail fast instead of queueing queries while MongoDB is unreachable.
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // The client fetches `portfolio`-tagged repositories straight from GitHub (client/src/hooks/usePortfolioProjects.js).
        'connect-src': ["'self'", 'https://api.github.com', 'https://raw.githubusercontent.com'],
      },
    },
  })
);
/**
 * An Origin is accepted when it is on the allowlist or when it is this very server
 * (Express serving client/dist — browsers send Origin on same-origin POSTs too).
 * Requests with no Origin header (curl, server-to-server) are left to the rate limiter + validation.
 */
const originAllowed = (req, origin) => {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  const self = `${req.protocol}://${req.get('host')}`;
  return origin === self;
};

app.use('/api', (req, res, next) =>
  cors({
    origin: (origin, cb) => cb(null, originAllowed(req, origin)),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  })(req, res, next)
);
// Belt and braces: a browser POST from an unlisted origin gets an explicit 403, not just missing CORS headers.
app.post('/api/*', (req, res, next) => {
  if (!originAllowed(req, req.get('origin'))) return res.status(403).json({ success: false, error: 'Origin not allowed.' });
  return next();
});
app.use(express.json({ limit: '10kb', type: 'application/json' }));

// ---- API ----
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});
app.use('/api/contact', contactRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/github-projects', githubProjectsRouter);
app.use('/api', (_req, res) => res.status(404).json({ success: false, message: 'Not found.' }));

// ---- Static React build (production) ----
const clientDist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '7d', index: false }));
  app.get('*', (req, res) => {
    // A missing file (e.g. /resume.pdf before it is added) should 404, not return the SPA shell.
    if (path.extname(req.path)) return res.status(404).type('text').send('Not found');
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ---- Error handler ----
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Malformed JSON body.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Payload too large.' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: 'Validation failed.' });
  }
  console.error(err);
  return res.status(500).json({ success: false, error: 'Something went wrong. Please try again later.' });
});

// ---- Boot ----
async function connectDatabase() {
  if (!MONGO_URI) {
    console.warn('[db] MONGO_URI is not set — messages will only be emailed (503 if SMTP is also unset).');
    return;
  }
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('[db] Connected to MongoDB');
  } catch (err) {
    console.error(`[db] Connection failed: ${err.message}`);
  }
}

mongoose.connection.on('disconnected', () => console.warn('[db] Disconnected'));

const server = app.listen(PORT, () => {
  console.log(`[api] Listening on http://localhost:${PORT}`);
  console.log(`[api] CORS allowlist: ${[...ALLOWED_ORIGINS].join(', ')}`);
  if (!process.env.SMTP_HOST) console.warn('[mail] SMTP_* not set — contact emails will not be sent.');
  if (!process.env.EMAIL_VERIFICATION_API_KEY) console.warn('[mail] EMAIL_VERIFICATION_API_KEY not set — mailbox existence check falls back to MX + disposable list.');
});
connectDatabase();

const shutdown = async (signal) => {
  console.log(`[api] ${signal} received, shutting down`);
  server.close();
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
