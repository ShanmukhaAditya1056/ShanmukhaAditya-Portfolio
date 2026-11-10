// Common misspellings → the domain the visitor almost certainly meant.
const CORRECTIONS = {
  // gmail
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmali.com': 'gmail.com',
  'googlemail.co': 'googlemail.com',
  // yahoo
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'ymail.co': 'ymail.com',
  // outlook / hotmail / live
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'outlook.con': 'outlook.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  'live.co': 'live.com',
  // icloud / proton
  'iclould.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'icoud.com': 'icloud.com',
  'protonmail.co': 'protonmail.com',
  'proton.m': 'proton.me',
};

const KNOWN = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'protonmail.com', 'proton.me', 'live.com', 'aol.com', 'ymail.com', 'googlemail.com'];

/** Damerau-Levenshtein (adjacent transposition counts as one edit). */
function distance(a, b) {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

/**
 * Returns a corrected full address when the domain looks like a typo of a popular provider,
 * otherwise null. Exact matches of known domains never produce a suggestion.
 */
export function suggestEmail(email) {
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain || KNOWN.includes(domain)) return null;

  if (CORRECTIONS[domain]) return `${local}@${CORRECTIONS[domain]}`;

  // fuzzy: within 1 edit of a well-known provider (e.g. "gmaik.com", "yahoo.cmo")
  for (const known of KNOWN) {
    if (Math.abs(known.length - domain.length) <= 1 && distance(domain, known) === 1) return `${local}@${known}`;
  }
  return null;
}
