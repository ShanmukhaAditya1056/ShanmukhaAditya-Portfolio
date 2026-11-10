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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Fail fast instead of queueing queries while MongoDB is unreachable.
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
if (CLIENT_ORIGIN.length > 0) {
  app.use('/api', cors({ origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] }));
}
app.use(express.json({ limit: '10kb' }));

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
    return res.status(400).json({ success: false, message: 'Malformed JSON body.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Payload too large.' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Validation failed.' });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
});

// ---- Boot ----
async function connectDatabase() {
  if (!MONGO_URI) {
    console.warn('[db] MONGO_URI is not set — contact form submissions will return 503.');
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
