import { z } from 'zod';
import { hasTags, stripCRLF, stripControl, stripTags } from './sanitize.js';

// Practical RFC 5322 subset: one @, no whitespace/control chars, dotted domain with a 2+ letter TLD.
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export const contactSchema = z.object({
  name: z
    .string({ required_error: 'Please enter your name.' })
    .transform(stripCRLF)
    .pipe(
      z
        .string()
        .min(2, 'Name must be 2–80 characters.')
        .max(80, 'Name must be 2–80 characters.')
        .refine((v) => !hasTags(v), 'Name cannot contain HTML.')
    ),
  email: z
    .string({ required_error: 'Please enter your email.' })
    .transform((v) => stripCRLF(v).toLowerCase())
    .pipe(
      z
        .string()
        .max(100, 'Email must be 100 characters or fewer.')
        .refine((v) => !/[\r\n]/.test(v), 'Email cannot contain line breaks.')
        .refine((v) => EMAIL_RE.test(v), 'Please enter a valid email address.')
        .refine((v) => !/\.\./.test(v) && !v.startsWith('.') && !v.includes('.@'), 'Please enter a valid email address.')
    ),
  subject: z
    .string({ required_error: 'Please enter a subject.' })
    .transform(stripCRLF)
    .pipe(z.string().min(3, 'Subject must be 3–120 characters.').max(120, 'Subject must be 3–120 characters.').refine((v) => !hasTags(v), 'Subject cannot contain HTML.')),
  message: z
    .string({ required_error: 'Please enter a message.' })
    .transform((v) => stripTags(stripControl(v)).replace(/\r\n?/g, '\n').trim())
    .pipe(z.string().min(10, 'Message must be 10–2000 characters.').max(2000, 'Message must be 10–2000 characters.')),
  // honeypot — must be empty (checked before validation; declared so unknown keys don't fail strict parsing)
  company_website: z.string().max(0).optional().or(z.literal('')),
});

/** Flatten zod issues to { field: firstMessage }. */
export function fieldErrors(zodError) {
  const out = {};
  for (const issue of zodError.issues) {
    const key = issue.path[0];
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
