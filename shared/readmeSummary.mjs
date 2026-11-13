/**
 * README → one-paragraph project summary. Shared by the API (server/routes/githubProjects.js)
 * and the browser fallback (client/src/hooks/usePortfolioProjects.js) so both produce the same text.
 */

export const SUMMARY_MIN = 120;
export const SUMMARY_MAX = 180;
const PORTFOLIO_TOPIC = 'portfolio';

/** True when a GitHub description is worth showing (not empty, not just the tag word typed by mistake). */
export function hasDescription(text) {
  const trimmed = String(text ?? '').trim();
  return Boolean(trimmed) && trimmed.toLowerCase().replace(/[^a-z]/g, '') !== PORTFOLIO_TOPIC;
}

/** Raw README URLs to try in order: README.md, then readme.md. */
export function readmeUrls(owner, repo, branch = 'main') {
  const base = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch || 'main')}`;
  return [`${base}/README.md`, `${base}/readme.md`];
}

/** Fetches the first README that exists. Resolves to '' when none does or the network fails. */
export async function fetchReadme(owner, repo, branch, { fetchImpl = fetch, timeoutMs = 5000, signal, headers } = {}) {
  for (const url of readmeUrls(owner, repo, branch)) {
    try {
      const timeout = AbortSignal.timeout(timeoutMs);
      const res = await fetchImpl(url, { headers, signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
      if (res.ok) return await res.text();
    } catch (err) {
      if (signal?.aborted) throw err;
    }
  }
  return '';
}

/** Markdown/HTML → plain-text paragraphs, with headings, badges, images, code, tables and lists removed. */
function paragraphs(markdown) {
  const text = String(markdown ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/^---\n[\s\S]*?\n---\n/, '') // YAML front matter
    .replace(/<!--[\s\S]*?-->/g, '') // HTML comments
    .replace(/^(```|~~~)[\s\S]*?^\1.*$/gm, '') // fenced code blocks
    .replace(/<(pre|code|script|style|table|picture|svg)[\s\S]*?<\/\1>/gi, '') // block HTML with content
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '') // linked badges [![alt](img)](link)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images / badges ![alt](img)
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, '') // reference-style images
    .replace(/<[^>]+>/g, ' '); // remaining HTML tags

  const blocks = [];
  let current = [];
  const flush = () => {
    if (current.length) blocks.push(current.join(' '));
    current = [];
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const structural =
      !line ||
      /^#{1,6}\s/.test(line) || // ATX heading
      /^(=+|-+)$/.test(line) || // setext underline
      /^([-*+]|\d+[.)])\s/.test(line) || // list item
      /^\|/.test(line) || // table row
      /^(\*\s*){3,}$|^(_\s*){3,}$/.test(line) || // horizontal rule
      /^( {4,}|\t)/.test(raw) || // indented code
      /^\[[^\]]+\]:\s/.test(line); // link reference definition
    if (structural) {
      flush();
      continue;
    }
    current.push(line.replace(/^>\s?/, '')); // blockquote marker
  }
  flush();

  return blocks.map((block) =>
    block
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url) → text
      .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1') // [text][ref] → text
      .replace(/`([^`]*)`/g, '$1') // inline code
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
      .replace(/(^|\W)[*_]([^*_]+)[*_](?=\W|$)/g, '$1$2') // italic
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** A paragraph reads like prose: enough words and letters, not a URL, badge row or "Table of contents". */
const isMeaningful = (p) =>
  p.length >= 40 &&
  p.split(' ').length >= 6 &&
  (p.match(/[a-z]/gi) || []).length / p.length > 0.6 &&
  !/^(https?:\/\/|table of contents|contents\b|toc\b)/i.test(p);

/** Cuts to at most `max` characters: at a sentence end inside the window, else at a word boundary with "…". */
export function truncateAtWord(text, min = SUMMARY_MIN, max = SUMMARY_MAX) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const window = clean.slice(0, max + 1);
  const sentenceEnd = Math.max(...['. ', '! ', '? '].map((m) => window.lastIndexOf(m)));
  if (sentenceEnd + 1 >= min) return clean.slice(0, sentenceEnd + 1);
  const cut = window.slice(0, max).lastIndexOf(' ');
  const head = clean.slice(0, cut > 0 ? cut : max).replace(/[\s,;:–—-]+$/, '');
  return `${head}…`;
}

/**
 * First meaningful paragraph of a README, 120–180 characters. Short paragraphs are joined with the
 * ones after them until the minimum is reached. Returns '' when the README has no usable prose.
 */
export function summarizeReadme(markdown, min = SUMMARY_MIN, max = SUMMARY_MAX) {
  const prose = paragraphs(markdown).filter(isMeaningful);
  if (!prose.length) return '';
  let summary = '';
  for (const p of prose) {
    const sentence = /[.!?…]$/.test(p) ? p : `${p}.`;
    summary = summary ? `${summary} ${sentence}` : sentence;
    if (summary.length >= min) break;
  }
  return truncateAtWord(summary, min, max);
}

/**
 * For every `portfolio`-tagged repo without a usable description, fetch its README and attach
 * `readme_summary` ('' when there is no README or no prose in it). Other repos are returned untouched.
 */
export async function attachReadmeSummaries(repos, owner, options = {}) {
  return Promise.all(
    repos.map(async (repo) => {
      const tagged = Array.isArray(repo.topics) && repo.topics.some((t) => String(t).toLowerCase() === PORTFOLIO_TOPIC);
      if (!tagged || hasDescription(repo.description) || typeof repo.readme_summary === 'string') return repo;
      const markdown = await fetchReadme(owner, repo.name, repo.default_branch, options);
      return { ...repo, readme_summary: summarizeReadme(markdown) };
    })
  );
}
