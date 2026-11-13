/**
 * Normalises GitHub repositories into the project shape rendered by Projects.jsx
 * ({ id, title, outcome, stack, demoUrl, repoUrl }), so fetched repos get the exact
 * same card, tech pills and [GitHub] / [Live Demo] buttons as the curated ones.
 */

import { hasDescription } from '../../../shared/readmeSummary.mjs';

export const PORTFOLIO_TOPIC = 'portfolio';
const MAX_PILLS = 6;

/** Words that stay fully uppercase in titles and pills. */
const ACRONYMS = new Set([
  'ai', 'ml', 'api', 'apis', 'ui', 'ux', 'iot', 'sql', 'nosql', 'aws', 'gcp', 'jwt', 'rbac', 'cli', 'sdk', 'llm', 'rag', 'db',
  'http', 'https', 'rest', 'json', 'xml', 'html', 'css', 'js', 'ts', 'oauth', 'sso', 'cicd', 'ci', 'cd', 'devops', 'se', 'cs',
  'nlp', 'ocr', 'gpu', 'cpu', 'tcp', 'udp', 'dns', 'vpn', 'ssl', 'tls', 'ssh', 'siem', 'soc', 'xss', 'csrf', 'ssrf', 'otp', 'mfa',
  'erp', 'crm', 'pdf', 'csv', 'ar', 'vr', 'ios', 'url', 'urls', 'ip', 'id', 'mern', 'mean', 'pwa', 'spa', 'ssr', 'orm', 'saas',
  'aes', 'rsa', 'ecc', 'ecdsa', 'ecdh', 'sha', 'hmac', 'pki', 'tpm', 'hsm', 'ids', 'ips', 'waf', 'owasp', 'nist', 'cve', 'gdpr',
]);

/** Mixed-case brand names that a plain capitalise() would get wrong. */
const BRANDS = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  nodejs: 'Node.js',
  node: 'Node.js',
  expressjs: 'Express.js',
  express: 'Express.js',
  reactjs: 'React',
  react: 'React',
  nextjs: 'Next.js',
  vuejs: 'Vue.js',
  nuxtjs: 'Nuxt.js',
  angular: 'Angular',
  svelte: 'Svelte',
  mongodb: 'MongoDB',
  mongoose: 'Mongoose',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
  sqlite: 'SQLite',
  redis: 'Redis',
  graphql: 'GraphQL',
  tailwindcss: 'Tailwind CSS',
  tailwind: 'Tailwind CSS',
  socketio: 'Socket.io',
  'socket-io': 'Socket.io',
  websocket: 'WebSocket',
  websockets: 'WebSockets',
  dotnet: '.NET',
  csharp: 'C#',
  cpp: 'C++',
  golang: 'Go',
  python: 'Python',
  java: 'Java',
  kotlin: 'Kotlin',
  swift: 'Swift',
  dart: 'Dart',
  flutter: 'Flutter',
  firebase: 'Firebase',
  supabase: 'Supabase',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  k8s: 'Kubernetes',
  nginx: 'NGINX',
  vite: 'Vite',
  webpack: 'Webpack',
  prisma: 'Prisma',
  sequelize: 'Sequelize',
  openai: 'OpenAI',
  langchain: 'LangChain',
  tensorflow: 'TensorFlow',
  pytorch: 'PyTorch',
  'scikit-learn': 'scikit-learn',
  sklearn: 'scikit-learn',
  opencv: 'OpenCV',
  fastapi: 'FastAPI',
  django: 'Django',
  flask: 'Flask',
  'spring-boot': 'Spring Boot',
  springboot: 'Spring Boot',
  github: 'GitHub',
  'github-actions': 'GitHub Actions',
  vercel: 'Vercel',
  render: 'Render',
  netlify: 'Netlify',
  stripe: 'Stripe',
  'machine-learning': 'Machine Learning',
  'deep-learning': 'Deep Learning',
  cybersecurity: 'Cybersecurity',
  'cyber-security': 'Cybersecurity',
  'web-security': 'Web Security',
  'full-stack': 'Full-Stack',
  fullstack: 'Full-Stack',
  'safe-browsing': 'Safe Browsing API',
  'wi-fi': 'Wi-Fi',
  wifi: 'Wi-Fi',
};

const capitalize = (word) => {
  const lower = word.toLowerCase();
  if (ACRONYMS.has(lower)) return lower.toUpperCase();
  if (/^v?\d/.test(lower)) return lower; // version numbers: v2, 3d
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/** `ai-threat-scanner` → `AI Threat Scanner`; `my_portfolio.site` → `My Portfolio Site`. */
export function titleFromRepoName(name = '') {
  const words = String(name)
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → spaced
    .split(/[-_.\s]+/)
    .filter(Boolean);
  return words.map(capitalize).join(' ').trim();
}

/** `nodejs` → `Node.js`, `rest-api` → `REST API`, `tailwindcss` → `Tailwind CSS`. */
export function techLabel(topic = '') {
  const key = String(topic).toLowerCase().trim();
  if (!key) return '';
  if (BRANDS[key]) return BRANDS[key];
  return key.split(/[-_]+/).filter(Boolean).map(capitalize).join(' ');
}

/** Tech pills: repo topics (minus `portfolio`), falling back to the primary language. */
export function stackFromRepo(repo) {
  const topics = Array.isArray(repo.topics) ? repo.topics : [];
  const pills = [];
  for (const topic of topics) {
    if (topic.toLowerCase() === PORTFOLIO_TOPIC) continue;
    const label = techLabel(topic);
    if (label && !pills.includes(label)) pills.push(label);
    if (pills.length === MAX_PILLS) break;
  }
  if (pills.length === 0 && repo.language) pills.push(techLabel(repo.language));
  return pills;
}

/** Trimmed, capitalised, ending with punctuation, so fetched text reads like the curated outcomes. */
function asSentence(text) {
  const trimmed = String(text ?? '').replace(/\s+/g, ' ').trim();
  const capped = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?…]$/.test(capped) ? capped : `${capped}.`;
}

/** "A", "A and B", "A, B, and C" */
const listOf = (items) =>
  items.length <= 2 ? items.join(' and ') : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;

/**
 * Last-resort summary built from the repo itself:
 * "Full-stack engineering project built with AES, Cryptography, and RSA." or, with no topics and no
 * language, "Hybrid Cryptographic Framework is a full-stack engineering project."
 */
export function fallbackDescription(title, stack = []) {
  return stack.length ? `Full-stack engineering project built with ${listOf(stack)}.` : `${title} is a full-stack engineering project.`;
}

/** Card summary: GitHub description, else first README paragraph, else generated from name + topics. */
export function describeRepo(repo, title = titleFromRepoName(repo.name), stack = stackFromRepo(repo)) {
  if (hasDescription(repo.description)) return asSentence(repo.description);
  if (repo.readme_summary) return asSentence(repo.readme_summary);
  return fallbackDescription(title, stack);
}

/** Absolute, safe http(s) URL or '' (GitHub's homepage field is free text). */
function safeUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

/** One GitHub API repo → one portfolio project. */
export function normalizeRepo(repo) {
  const title = titleFromRepoName(repo.name);
  const stack = stackFromRepo(repo);
  return {
    id: repo.name,
    title,
    outcome: describeRepo(repo, title, stack),
    stack,
    demoUrl: safeUrl(repo.homepage),
    repoUrl: repo.html_url,
    source: 'github',
    updatedAt: repo.pushed_at || repo.updated_at || null,
  };
}

const repoKey = (url = '') =>
  String(url)
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '');

/** Lower-case alphanumerics only, so `Hybrid-Cryptographic-Framework` and `hybrid_cryptographic framework` match. */
const nameKey = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');

/** Case-insensitive `portfolio` topic check. */
export const isPortfolioRepo = (repo) =>
  Boolean(repo?.topics) && repo.topics.map((t) => String(t).toLowerCase()).includes(PORTFOLIO_TOPIC);

/** The fetched repo that is the same project as a curated entry: same GitHub URL, or same id/title as the repo name. */
function findMatch(project, repos) {
  const url = repoKey(project.repoUrl);
  const ids = [nameKey(project.id), nameKey(project.title)];
  return repos.find((r) => (url && repoKey(r.html_url) === url) || ids.includes(nameKey(r.name)));
}

/**
 * Curated flagship projects first and never replaced (their [Architecture] modals key off their ids).
 * A matching GitHub repo only fills gaps: Live Demo from its Homepage, summary from its description,
 * GitHub link from its URL — curated values always win. Every other `portfolio`-tagged repo is appended,
 * newest push first.
 */
export function mergeProjects(curated = [], repos = []) {
  const list = repos.filter(Boolean);
  const claimed = new Set();

  const pinned = curated.map((project) => {
    const repo = findMatch(project, list);
    if (!repo) return project;
    claimed.add(repo);
    const fresh = normalizeRepo(repo);
    return {
      ...project,
      repoUrl: project.repoUrl || fresh.repoUrl,
      demoUrl: project.demoUrl || fresh.demoUrl,
      outcome: project.outcome || fresh.outcome,
    };
  });

  const extra = list
    .filter((r) => !claimed.has(r) && !r.fork && !r.archived && isPortfolioRepo(r))
    .sort((a, b) => new Date(b.pushed_at || b.updated_at || 0) - new Date(a.pushed_at || a.updated_at || 0))
    .map(normalizeRepo);

  return [...pinned, ...extra];
}
