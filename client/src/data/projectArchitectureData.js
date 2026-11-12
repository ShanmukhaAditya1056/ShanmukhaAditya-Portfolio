/**
 * Architecture details shown in the "Architecture" modal of each project card.
 * Keyed by the project `id` in shared/projects.json. A project without an entry simply gets no button.
 *
 * nodes      — request pipeline, in order (label + what that stage does)
 * decisions  — security / engineering decisions
 * snippet    — production code excerpt (language, file name, code)
 */
export const projectArchitecture = {
  'cyberguard-ai': {
    tagline: 'Real-time phishing URL detection with multi-hop redirect resolution.',
    nodes: [
      { label: 'Flutter / React Client', detail: 'Submits the URL to scan and streams verdicts back to the mobile or web UI.' },
      { label: 'Express API + Rate Limiter', detail: 'Per-IP sliding-window limiter and strict body schema stop abuse before any outbound request is made.' },
      { label: 'Multi-Hop Redirect Resolver', detail: 'Follows shortener and tracking redirects manually, hop by hop, with a hard cap and an abort timeout per hop.' },
      { label: 'Google Safe Browsing Hash-Prefix API + Local Threat Scorer', detail: 'Every URL in the chain is canonicalised, SHA-256 hashed and looked up by prefix; a local heuristic scorer weighs the full chain.' },
      { label: 'Socket.io Real-Time Alert Console', detail: 'Verdicts and chain details are pushed live to the alert console without polling.' },
    ],
    decisions: [
      'Resolves obfuscated URL shorteners across up to 5 hops before hash-prefix querying to prevent SSRF and evasion — every hop is checked against private, loopback and link-local ranges before it is fetched.',
      'Uses SHA-256 prefix caching to minimise external API latency and preserve user privacy: only 4-byte hash prefixes ever leave the server, and repeated prefixes are served from an in-memory TTL cache.',
      'Each hop is a HEAD request with redirect: "manual" and a 3 s AbortController timeout, so a slow or malicious host cannot stall the worker.',
      'Verdicts are scored on the whole chain, not just the final URL, so a clean landing page behind a flagged intermediate still raises an alert.',
    ],
    snippet: {
      language: 'javascript',
      filename: 'server/utils/resolveRedirectChainAndScan.js',
      code: `const MAX_HOPS = 5;
const HOP_TIMEOUT_MS = 3000;

export async function resolveRedirectChainAndScan(targetUrl) {
  const chain = [];
  let current = targetUrl;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    assertPublicHost(current); // SSRF guard: rejects private, loopback and link-local ranges
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), HOP_TIMEOUT_MS);
    const res = await fetch(current, { method: 'HEAD', redirect: 'manual', signal: ac.signal })
      .finally(() => clearTimeout(timer));
    chain.push({ url: current, status: res.status });
    const next = res.headers.get('location');
    if (!next || res.status < 300 || res.status > 399) break;
    current = new URL(next, current).href;
  }
  // Safe Browsing payload: 4-byte SHA-256 prefixes of every canonicalised URL in the chain
  const prefixes = chain.map(({ url }) => sha256(canonicalize(url)).slice(0, 8));
  const verdict = await lookupSafeBrowsing(prefixes); // cached per prefix, 1 outbound call per batch
  return { finalUrl: current, hops: chain.length, threatScore: scoreLocally(chain, verdict), verdict };
}`,
    },
  },

  'mulegraph-ai': {
    tagline: 'Anti-mule fraud investigation with tamper-evident audit logging.',
    nodes: [
      { label: 'React Graph Canvas', detail: 'Interactive transaction network: accounts as nodes, transfers as weighted edges, with investigator annotations.' },
      { label: 'JWT + RBAC Middleware', detail: 'Short-lived access tokens; investigator, analyst and admin roles gate every route and every graph query.' },
      { label: 'Transaction Velocity & Device Fingerprint Engine', detail: 'Flags burst transfers, circular fund flows and multiple accounts sharing one device fingerprint.' },
      { label: 'MongoDB Aggregation Pipeline', detail: '$graphLookup walks transfer chains to a bounded depth and groups by fingerprint for cluster detection.' },
      { label: 'Immutable SHA-256 Chained Audit Log', detail: 'Every investigator action is appended with a hash of the previous entry, making history tamper-evident.' },
    ],
    decisions: [
      'Detects circular fund transfers and shared device fingerprints across accounts in real time: $graphLookup with a bounded maxDepth finds A→B→C→A cycles, and a fingerprint index surfaces accounts that log in from the same device.',
      'Implements append-only cryptographic hash chaining on audit logs so investigator actions cannot be tampered with — update and delete hooks on the collection throw, and a nightly job re-walks the chain to verify every hash.',
      'Rate limiting is applied per user, not per IP, because investigators share office NAT; the budget scales with role.',
      'Edge case: a transfer that arrives before its counter-party account exists is parked in a pending set and re-evaluated when the account appears, so late data never breaks cycle detection.',
    ],
    snippet: {
      language: 'javascript',
      filename: 'server/models/AuditLog.js',
      code: `import crypto from 'node:crypto';
import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
  {
    actor: { type: String, required: true },
    action: { type: String, required: true },
    payload: { type: Object, required: true },
    previousHash: { type: String, default: null },
    hash: { type: String, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Chain each entry to the one before it: hash = SHA-256(previousHash + currentPayload)
auditSchema.pre('save', async function chainHash() {
  const last = await this.constructor.findOne({}, { hash: 1 }).sort({ _id: -1 }).lean();
  this.previousHash = last?.hash ?? 'GENESIS';
  const material = this.previousHash + JSON.stringify({ actor: this.actor, action: this.action, payload: this.payload });
  this.hash = crypto.createHash('sha256').update(material).digest('hex');
});

// Append-only: nothing in the log can be rewritten or removed through the model
auditSchema.pre(['updateOne', 'findOneAndUpdate', 'deleteOne', 'deleteMany'], function block() {
  throw new Error('Audit log is append-only');
});

export default mongoose.model('AuditLog', auditSchema);`,
    },
  },

  'multi-college-library': {
    tagline: 'Multi-tenant circulation platform with silent token rotation.',
    nodes: [
      { label: 'React Client + Axios Interceptor', detail: 'All API calls go through one Axios instance whose interceptor refreshes expired tokens transparently.' },
      { label: 'Express REST API', detail: 'Versioned REST routes for catalogue, members, loans and reservations with validated request bodies.' },
      { label: 'Multi-Tenant RBAC Guard', detail: 'Resolves the caller’s institutionId and role from the JWT and scopes every query to that tenant.' },
      { label: 'MongoDB Atomic Transaction Session', detail: 'Borrow and return run in a session so stock, loan and member records change together or not at all.' },
    ],
    decisions: [
      'Automated Axios request/response interceptors handle silent JWT access-token rotation on 401 Unauthorized and queue concurrent failed requests without dropping user state — one refresh call is in flight at a time and every queued request is replayed with the new token.',
      'Tenant isolation ensures college admins and students only query records scoped to their institutionId: the guard injects the tenant filter server-side, so a client can never widen the query.',
      'Refresh tokens live in an httpOnly, SameSite cookie; access tokens stay in memory only, so XSS cannot read them and CSRF cannot use them.',
      'Edge case: a book returned at the exact moment another student reserves it is handled inside the transaction, so stock never goes negative and the reservation queue stays ordered.',
    ],
    snippet: {
      language: 'javascript',
      filename: 'client/src/lib/api.js',
      code: `let isRefreshing = false;
let failedQueue = []; // requests that hit 401 while a refresh is already in flight

const flushQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) return Promise.reject(error);
    if (isRefreshing) {
      // Park this request until the single refresh resolves, then retry it with the new token
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject })).then((token) => {
        originalRequest.headers.Authorization = \`Bearer \${token}\`;
        return api(originalRequest);
      });
    }
    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const { data } = await axios.post('/auth/refresh', {}, { withCredentials: true });
      setAccessToken(data.accessToken);
      flushQueue(null, data.accessToken);
      originalRequest.headers.Authorization = \`Bearer \${data.accessToken}\`;
      return api(originalRequest);
    } catch (err) {
      flushQueue(err);
      logout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);`,
    },
  },

  'devtrack-se-platform': {
    tagline: 'SDLC platform with bidirectional traceability and live telemetry.',
    nodes: [
      { label: 'Vite + React Dashboard', detail: 'MoSCoW backlog, Kanban sprints, traceability matrix and QA telemetry views in one workspace.' },
      { label: 'Firebase Real-Time Listener / RBAC', detail: 'Auth, workspace roles and live presence; listeners push board changes to every member instantly.' },
      { label: 'Prisma ORM + Zod Schema Validator', detail: 'Every mutation is validated by a Zod schema before Prisma runs it inside a transaction.' },
      { label: 'PostgreSQL Relational Store + Dockerized CI/CD Telemetry', detail: 'Requirements, tasks, test runs and pipeline events in normalised tables; a Dockerised runner feeds CI/CD telemetry.' },
    ],
    decisions: [
      'Bidirectional traceability matrix links MoSCoW requirements directly to Kanban sprint tasks and QA test runs: a trace-link table with composite unique keys means coverage can be read in both directions with one join.',
      'Real-time team invitation state machine prevents duplicate role assignments and enforces strict workspace permissions — invites move PENDING → ACCEPTED | EXPIRED | REVOKED, and a unique (workspaceId, email) constraint rejects double invites at the database.',
      'Rate limiting on invitation and telemetry endpoints is per workspace, so one noisy CI pipeline cannot starve another team.',
      'Edge case: linking a task that was moved to a different sprint mid-request fails inside the transaction and rolls back, so the matrix never references a task outside its sprint.',
    ],
    snippet: {
      language: 'typescript',
      filename: 'server/services/linkRequirement.ts',
      code: `const LinkSchema = z.object({
  requirementId: z.string().cuid(),
  taskId: z.string().cuid(),
  sprintId: z.string().cuid(),
  priority: z.enum(['MUST', 'SHOULD', 'COULD', 'WONT']),
});

export async function linkRequirementToTask(input: unknown, actorId: string) {
  const data = LinkSchema.parse(input); // throws a ZodError → 400 before anything touches the DB
  const link = await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUniqueOrThrow({ where: { id: data.taskId }, select: { sprintId: true } });
    if (task.sprintId !== data.sprintId) throw new Error('Task is not in the target sprint');
    const created = await tx.traceLink.create({ data: { ...data, createdById: actorId } });
    await tx.requirement.update({
      where: { id: data.requirementId },
      data: { priority: data.priority, coverage: { increment: 1 } },
    });
    return created;
  });
  await telemetry.emit('trace.linked', { linkId: link.id, requirementId: data.requirementId, taskId: data.taskId });
  return link;
}`,
    },
  },
};

export default projectArchitecture;
