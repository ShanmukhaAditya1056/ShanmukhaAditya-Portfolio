import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import ContactMessage from '../models/ContactMessage.js';
import { contactSchema, fieldErrors } from '../utils/contactSchema.js';
import { verifyEmail } from '../utils/emailVerification.js';
import { mailConfigured, sendOwnerNotification, sendVisitorAck } from '../utils/mailer.js';

const router = Router();

// 3 submissions per IP every 15 minutes.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many messages from this connection. Please try again in 15 minutes.' },
});

const ok = (res, status, body) => res.status(status).json({ success: true, ...body });
const fail = (res, status, error, errors) => res.status(status).json({ success: false, error, message: error, ...(errors ? { errors } : {}) });

router.post('/', contactLimiter, async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    // 1. Honeypot — humans never see or fill `company_website`. Pretend success so bots learn nothing.
    if (typeof body.company_website === 'string' && body.company_website.trim() !== '') {
      return ok(res, 201, { message: 'Message received.' });
    }
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return ok(res, 201, { message: 'Message received.' });
    }

    // 2. Schema validation + sanitisation (CRLF stripped, tags removed, lengths enforced).
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return fail(res, 400, 'Please fix the highlighted fields.', fieldErrors(parsed.error));
    }
    const { name, email, subject, message } = parsed.data;

    // 3. Email verification pipeline: disposable blocklist → MX → mailbox existence.
    const verification = await verifyEmail(email);
    if (!verification.ok) {
      return fail(res, 400, verification.error, { email: verification.error });
    }

    const canMail = mailConfigured();
    const canStore = mongoose.connection.readyState === 1;
    if (!canMail && !canStore) {
      return fail(res, 503, 'The message service is temporarily unavailable. Please email me directly.');
    }

    const meta = {
      ip: req.ip,
      userAgent: String(req.get('user-agent') || '').slice(0, 200),
      verified: verification.verified ? 'mailbox confirmed' : 'domain checked',
      receivedAt: new Date().toISOString(),
    };

    // 4. Deliver. Owner notification is required when SMTP is configured; the ack is best-effort.
    if (canMail) {
      const owner = await sendOwnerNotification({ name, email, subject, message, meta });
      console.log('[mail] owner notified', owner?.messageId || '');
      if (process.env.SEND_AUTO_REPLY !== 'false') {
        sendVisitorAck({ name, email, subject, message })
          .then((ack) => ack && console.log('[mail] auto-reply sent', ack.messageId || ''))
          .catch((err) => console.warn('[mail] auto-reply failed:', err.message));
      }
    }

    // 5. Persist (best-effort when mail went out; required when it is the only channel).
    let id;
    if (canStore) {
      try {
        const saved = await ContactMessage.create({ name, email, subject, message, ip: meta.ip, userAgent: meta.userAgent, emailVerified: Boolean(verification.verified) });
        id = saved._id;
      } catch (err) {
        if (!canMail) throw err;
        console.warn('[db] could not store contact message:', err.message);
      }
    }

    return ok(res, 201, { message: 'Message received.', id });
  } catch (err) {
    return next(err);
  }
});

export default router;
