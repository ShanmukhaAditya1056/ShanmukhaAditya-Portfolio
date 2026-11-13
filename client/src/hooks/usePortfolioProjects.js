import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { profile } from '../data/profile.js';
import { mergeProjects, isPortfolioRepo } from '../lib/githubProjects.js';
import { attachReadmeSummaries } from '../../../shared/readmeSummary.mjs';
import useProjects from './useProjects.js';

const CACHE_KEY = 'portfolio:github-repos:v3';
// Short cache in production (GitHub allows 60 unauthenticated calls/hour per IP); none in dev,
// so a topic added on GitHub shows up on the next reload of localhost.
const CACHE_TTL_MS = import.meta.env.DEV ? 0 : 5 * 60 * 1000;
const GITHUB_API = 'https://api.github.com';

/** Temporary debug output for the fetcher — dev server only, never in the production bundle's console. */
const debug = (...args) => {
  if (import.meta.env.DEV) console.log('[portfolio-projects]', ...args);
};

/** GitHub username from profile.github ("https://github.com/<user>"), overridable with VITE_GITHUB_USER. */
export function githubUsername() {
  const fromEnv = import.meta.env.VITE_GITHUB_USER;
  if (fromEnv) return String(fromEnv).trim();
  const match = String(profile.github || '').match(/github\.com\/([^/?#]+)/i);
  return match ? match[1] : 'ShanmukhaAditya1056';
}

function readCache() {
  if (!CACHE_TTL_MS) return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, repos } = JSON.parse(raw);
    if (!Array.isArray(repos) || Date.now() - at > CACHE_TTL_MS) return null;
    return repos;
  } catch {
    return null;
  }
}

function writeCache(repos) {
  if (!CACHE_TTL_MS) return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos }));
  } catch {
    /* storage unavailable (private mode / quota) — just refetch next time */
  }
}

/** 1st choice: our own API (server-side cache, shared quota). Throws on 404 / network / proxy errors. */
async function fromOwnApi(signal) {
  const { data } = await api.get('/api/github-projects', { signal, timeout: 6000 });
  if (!data?.success || !Array.isArray(data.data)) throw new Error('unexpected /api/github-projects payload');
  return data.data;
}

/** Fallback: GitHub's public REST API, straight from the browser (topics are included in this media type). */
async function fromGitHub(user, signal) {
  const url = `${GITHUB_API}/users/${encodeURIComponent(user)}/repos?sort=pushed&per_page=50`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();
  const repos = Array.isArray(data) ? data : [];
  // Same README step the API does: tagged repos without a description get their README's first paragraph.
  return attachReadmeSummaries(repos, user, { signal });
}

/** Raw repo list: session cache → /api/github-projects → GitHub directly. Throws only if every source fails. */
export async function fetchPortfolioRepos(signal) {
  const cached = readCache();
  if (cached) {
    debug('using cached repositories', cached);
    return cached;
  }
  let repos;
  try {
    repos = await fromOwnApi(signal);
    debug(`raw repositories from /api/github-projects (${repos.length})`, repos);
  } catch (err) {
    if (err?.name === 'AbortError' || err?.name === 'CanceledError') throw err;
    debug('/api/github-projects unavailable, falling back to api.github.com:', err?.response?.status || err.message);
    repos = await fromGitHub(githubUsername(), signal);
    debug(`raw repositories from api.github.com (${repos.length})`, repos);
  }
  writeCache(repos);
  return repos;
}

/**
 * Curated projects (shared/projects.json, refreshed from /api/projects) pinned first, then every
 * GitHub repository tagged with the `portfolio` topic, normalised to the same card format.
 */
export default function usePortfolioProjects() {
  const curated = useProjects();
  const [repos, setRepos] = useState(() => readCache() || []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPortfolioRepos(controller.signal)
      .then((list) => {
        debug(
          'repositories matching the "portfolio" topic',
          list.filter(isPortfolioRepo).map((r) => ({ name: r.name, topics: r.topics }))
        );
        setRepos(list);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError' && err?.name !== 'CanceledError') {
          debug('GitHub fetch failed, showing curated projects only:', err.message);
        }
      });
    return () => controller.abort();
  }, []);

  const projects = mergeProjects(curated, repos);
  useEffect(() => {
    if (repos.length) debug('final merged projects', projects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, curated]);
  return projects;
}
