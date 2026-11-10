/** Collapse CR/LF into spaces — prevents SMTP header injection via name/email/subject. */
export const stripCRLF = (s = '') => String(s).replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

/** Remove anything that looks like an HTML tag (including <script>…</script> bodies). */
export const stripTags = (s = '') =>
  String(s)
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<\/?[a-z!?][^>]*>/gi, '');

/** Escape HTML entities for safe interpolation into an HTML email body. */
export const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** True when the string contains a tag-like sequence. */
export const hasTags = (s = '') => /<\/?[a-z!?][^>]*>/i.test(String(s));

/** Remove ASCII control characters except \n and \t (used for the multi-line message). */
export const stripControl = (s = '') => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
