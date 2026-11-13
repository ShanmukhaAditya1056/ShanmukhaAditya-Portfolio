import { Router } from 'express';
import { attachReadmeSummaries } from '../../shared/readmeSummary.mjs';

/**
 * GET /api/github-projects — the owner's public repositories, fetched server-side and cached,
 * so every visitor shares one GitHub call instead of spending their own 60/hour IP quota.
 * The client filters by the `portfolio` topic and normalises the cards (client/src/lib/githubProjects.js).
 * Tagged repos without a description carry `readme_summary`, the first paragraph of their README.
 * Set GITHUB_TOKEN (no scopes needed) to raise GitHub's limit from 60 to 5,000 requests/hour.
 */
// 10 minutes in production; off in development so a topic added on GitHub shows on the next reload.
const CACHE_MS = process.env.NODE_ENV === 'production' ? 10 * 60 * 1000 : 0;
const GITHUB_USER =
  (process.env.OWNER_GITHUB || 'https://github.com/ShanmukhaAditya1056').match(/github\.com\/([^/?#]+)/i)?.[1] ||
  'ShanmukhaAditya1056';

let cache = { at: 0, repos: null };

const slim = (r) => ({
  name: r.name,
  description: r.description,
  html_url: r.html_url,
  homepage: r.homepage,
  language: r.language,
  topics: r.topics,
  default_branch: r.default_branch,
  fork: r.fork,
  archived: r.archived,
  pushed_at: r.pushed_at,
  updated_at: r.updated_at,
});

async function fetchRepos() {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-site' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const url = `https://api.github.com/users/${encodeURIComponent(GITHUB_USER)}/repos?type=owner&sort=pushed&per_page=100`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();
  const repos = Array.isArray(data) ? data.map(slim) : [];
  // Tagged repos with no description get the first paragraph of their README instead.
  return attachReadmeSummaries(repos, GITHUB_USER, { headers: { 'User-Agent': 'portfolio-site' } });
}

const router = Router();

router.get('/', async (req, res) => {
  const fresh = cache.repos && Date.now() - cache.at < CACHE_MS;
  if (!fresh || req.query.refresh === '1') {
    try {
      cache = { at: Date.now(), repos: await fetchRepos() };
    } catch (err) {
      console.warn('[github] repo fetch failed:', err.message);
      // Serve the last good copy if there is one; otherwise let the client fall back to GitHub directly.
      if (!cache.repos) return res.status(502).json({ success: false, message: 'GitHub unavailable.' });
    }
  }
  // Browsers may reuse the list for 5 minutes in production; never in development.
  res.set('Cache-Control', CACHE_MS ? 'public, max-age=300' : 'no-store');
  res.json({ success: true, data: cache.repos });
});

export default router;
