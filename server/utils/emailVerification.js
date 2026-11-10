import dns from 'node:dns/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
/** ~4,000 known burner domains, plus a few hand-picked ones the list may lag on. */
const DISPOSABLE = new Set([
  ...require('disposable-email-domains'),
  'mailinator.com',
  '10minutemail.com',
  'yopmail.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'sharklasers.com',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'maildrop.cc',
  'fakeinbox.com',
  'throwawaymail.com',
  'mohmal.com',
  'emailondeck.com',
]);

const API_TIMEOUT_MS = 3000;
const MX_TIMEOUT_MS = 3000;

/** Verifier endpoints. "abstract" is AbstractAPI's current Email Reputation product; "abstract-validation" its legacy Email Validation API. */
const PROVIDER_URLS = {
  abstract: 'https://emailreputation.abstractapi.com/v1/',
  'abstract-validation': 'https://emailvalidation.abstractapi.com/v1/',
  hunter: 'https://api.hunter.io/v2/email-verifier',
  zerobounce: 'https://api.zerobounce.net/v2/validate',
};

/** Warn once per HTTP status so a bad key / exhausted quota is visible in the logs instead of silently degrading. */
const warnedStatuses = new Set();
function warnProvider(provider, status, body) {
  if (warnedStatuses.has(status)) return;
  warnedStatuses.add(status);
  const detail = body?.error?.message || body?.errors?.[0]?.details || body?.error || '';
  console.warn(`[verify] ${provider} returned HTTP ${status}${detail ? ` (${detail})` : ''} — mailbox check is falling back to DNS + blocklist only.`);
}

export const domainOf = (email) => email.slice(email.lastIndexOf('@') + 1).toLowerCase();

/** Step 1 — disposable / burner domain blocklist. */
export function isDisposable(email) {
  const domain = domainOf(email);
  // also catch sub-domains of a listed provider (e.g. foo.mailinator.com)
  const parts = domain.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    if (DISPOSABLE.has(parts.slice(i).join('.'))) return true;
  }
  return false;
}

const withTimeout = (promise, ms, label) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out`)), ms))]);

/** Step 2 — does the domain publish MX records (or at least an A/AAAA fallback)? */
export async function hasMailServer(email) {
  const domain = domainOf(email);
  try {
    const mx = await withTimeout(dns.resolveMx(domain), MX_TIMEOUT_MS, 'MX lookup');
    if (mx.some((r) => r.exchange && r.exchange !== '.')) return true;
  } catch (err) {
    if (!['ENODATA', 'ENOTFOUND', 'ESERVFAIL'].includes(err.code) && !/timed out/.test(err.message)) throw err;
    if (/timed out/.test(err.message)) return null; // unknown — don't punish the visitor for our DNS being slow
  }
  // RFC 5321 fallback: a domain with no MX but an A record can still receive mail
  try {
    await withTimeout(dns.resolve4(domain), MX_TIMEOUT_MS, 'A lookup');
    return true;
  } catch {
    return false;
  }
}

/**
 * Step 3 — real-time mailbox existence check via a third-party verifier.
 * Returns: true (deliverable) | false (definitely undeliverable) | null (unknown / not configured / timed out).
 *
 * Providers (EMAIL_VERIFICATION_PROVIDER): "abstract" (default, AbstractAPI Email Reputation),
 * "abstract-validation" (AbstractAPI legacy Email Validation), "hunter", "zerobounce".
 */
export async function verifyMailboxExists(email) {
  const key = process.env.EMAIL_VERIFICATION_API_KEY;
  if (!key) return null;
  const provider = (process.env.EMAIL_VERIFICATION_PROVIDER || 'abstract').toLowerCase();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const base =
      process.env.EMAIL_VERIFICATION_API_URL || // optional override (self-hosted / testing); same query params as the provider
      PROVIDER_URLS[provider] ||
      PROVIDER_URLS.abstract;
    const url = `${base}${base.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}`;

    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!res.ok) {
      warnProvider(provider, res.status, await res.json().catch(() => null));
      return null; // quota exceeded / bad key → fall back, never block the visitor
    }
    const data = await res.json();

    if (provider === 'hunter') {
      const d = data?.data ?? {};
      if (d.result === 'undeliverable' || d.status === 'invalid' || d.status === 'disposable') return false;
      if (d.result === 'deliverable' || d.status === 'valid' || d.status === 'accept_all' || d.status === 'webmail') return true;
      return null;
    }
    if (provider === 'zerobounce') {
      if (['invalid', 'spamtrap', 'abuse', 'do_not_mail'].includes(data?.status)) return false;
      if (['valid', 'catch-all'].includes(data?.status)) return true;
      return null;
    }

    // AbstractAPI — Email Reputation shape: { email_deliverability: { status, is_smtp_valid }, email_quality: { is_disposable } }
    if (data?.email_deliverability) {
      const d = data.email_deliverability;
      const status = String(d.status || '').toLowerCase(); // deliverable | undeliverable | unknown
      if (status === 'undeliverable' || d.is_smtp_valid === false || data.email_quality?.is_disposable === true) return false;
      if (status === 'deliverable' && d.is_smtp_valid === true) return true;
      return null;
    }
    // AbstractAPI — legacy Email Validation shape: { deliverability, is_smtp_valid: { value }, is_disposable_email: { value } }
    const deliverability = data?.deliverability; // DELIVERABLE | UNDELIVERABLE | RISKY | UNKNOWN
    const smtpValid = data?.is_smtp_valid?.value;
    const disposable = data?.is_disposable_email?.value;
    if (deliverability === 'UNDELIVERABLE' || smtpValid === false || disposable === true) return false;
    if (deliverability === 'DELIVERABLE' && smtpValid === true) return true;
    return null; // RISKY / UNKNOWN
  } catch {
    return null; // network error or 3s timeout → graceful fallback
  } finally {
    clearTimeout(timer);
  }
}

export const MAILBOX_ERROR = 'This email address does not exist or cannot receive mail. Please enter a valid email.';

/**
 * Full pipeline. Resolves to { ok: true } or { ok: false, error }.
 * Only definite negatives block; "unknown" results fall through to the next layer.
 */
export async function verifyEmail(email) {
  if (isDisposable(email)) {
    return { ok: false, error: 'Temporary or disposable email addresses are not accepted. Please use a permanent email.' };
  }
  const mx = await hasMailServer(email);
  if (mx === false) return { ok: false, error: MAILBOX_ERROR };

  const mailbox = await verifyMailboxExists(email);
  if (mailbox === false) return { ok: false, error: MAILBOX_ERROR };

  return { ok: true, verified: mailbox === true };
}
