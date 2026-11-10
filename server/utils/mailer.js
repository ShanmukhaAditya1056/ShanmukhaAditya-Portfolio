import nodemailer from 'nodemailer';
import { escapeHtml } from './sanitize.js';

const OWNER_EMAIL = process.env.CONTACT_TO || 'madalaadithya1056@gmail.com';
const OWNER_NAME = process.env.CONTACT_OWNER_NAME || 'Shanmukha Aditya';
const SITE_NAME = process.env.SITE_NAME || 'Shanmukha Aditya – Portfolio';

let transport = null;

/** Lazily build the SMTP transport. Returns null when SMTP is not configured. */
export function getTransport() {
  if (transport) return transport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  // Dev convenience: SMTP_HOST=console prints the fully-built messages instead of sending them.
  if (SMTP_HOST === 'console') {
    transport = nodemailer.createTransport({ jsonTransport: true });
    const send = transport.sendMail.bind(transport);
    transport.sendMail = async (msg) => {
      const info = await send(msg);
      console.log('[mail:console]', info.message);
      return info;
    };
    return transport;
  }
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT) || 587;
  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });
  return transport;
}

export const mailConfigured = () => getTransport() !== null;

const fromAddress = () => process.env.CONTACT_FROM || `"${SITE_NAME}" <${process.env.SMTP_USER || OWNER_EMAIL}>`;

/**
 * Notification to the site owner. All fields arrive already sanitised (CRLF stripped, tags removed);
 * we still entity-escape for the HTML part so nothing is ever interpreted as markup.
 */
export async function sendOwnerNotification({ name, email, subject, message, meta = {} }) {
  const t = getTransport();
  if (!t) throw new Error('SMTP not configured');

  const safe = { name: escapeHtml(name), email: escapeHtml(email), subject: escapeHtml(subject), message: escapeHtml(message).replace(/\n/g, '<br>') };
  const metaText = Object.entries(meta)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return t.sendMail({
    from: fromAddress(),
    to: OWNER_EMAIL,
    replyTo: `"${name.replace(/"/g, '')}" <${email}>`,
    subject: `[Portfolio] ${subject}`,
    text: `New message from your portfolio contact form\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}\n\n---\n${metaText}`,
    html: `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:620px;margin:0 auto;color:#0b1728">
        <h2 style="margin:0 0 16px;font-size:20px">New message from your portfolio</h2>
        <table style="border-collapse:collapse;width:100%;font-size:15px">
          <tr><td style="padding:6px 0;color:#64748b;width:90px">Name</td><td style="padding:6px 0">${safe.name}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Subject</td><td style="padding:6px 0">${safe.subject}</td></tr>
        </table>
        <div style="margin:18px 0;padding:16px;background:#f1f5f9;border-radius:10px;font-size:15px;line-height:1.55">${safe.message}</div>
        <p style="font-size:12px;color:#94a3b8;white-space:pre-line">${escapeHtml(metaText)}</p>
      </div>`,
  });
}

/**
 * Plain-text acknowledgement to the visitor. Doubles as a bounce trap: if the mailbox slipped
 * through verification but does not exist, the provider's mailer-daemon bounce lands with the owner.
 */
export async function sendVisitorAck({ name, email, subject, message = '' }) {
  const t = getTransport();
  if (!t) return null;
  const firstName = name.split(/\s+/)[0];
  const site = process.env.SITE_URL || 'https://shanmukhaaditya-portfolio.vercel.app';
  const github = process.env.OWNER_GITHUB || 'https://github.com/ShanmukhaAditya1056';
  const linkedin = process.env.OWNER_LINKEDIN || 'https://www.linkedin.com/in/shanmukhaaditya-madala/';
  const safe = { firstName: escapeHtml(firstName), subject: escapeHtml(subject), message: escapeHtml(message).replace(/\n/g, '<br>') };

  const text = [
    `Hi ${firstName},`,
    '',
    `Thanks for reaching out about "${subject}". Your message has landed in my inbox and I'll reply within 1–2 business days.`,
    '',
    'For reference, here is what you sent:',
    '',
    message.split('\n').map((l) => `> ${l}`).join('\n'),
    '',
    `In the meantime: ${site} · GitHub ${github} · LinkedIn ${linkedin}`,
    '',
    "If you didn't send this, you can safely ignore this email.",
    '',
    `— ${OWNER_NAME}`,
    OWNER_EMAIL,
  ].join('\n');

  const html = `
    <div style="background:#0b2545;padding:32px 16px;font-family:Inter,Segoe UI,Arial,sans-serif">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1d3a5f,#2f5f8f);padding:28px 32px;color:#fff">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.8">${escapeHtml(SITE_NAME)}</p>
          <h1 style="margin:0;font-size:24px;font-weight:700">Thanks for reaching out, ${safe.firstName}!</h1>
        </div>
        <div style="padding:28px 32px;color:#0b1728;font-size:15px;line-height:1.6">
          <p style="margin:0 0 16px">Your message about <strong>“${safe.subject}”</strong> has landed in my inbox. I read every message personally and will reply within <strong>1–2 business days</strong>.</p>
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:.12em">What you sent</p>
          <div style="padding:14px 16px;background:#f1f5f9;border-left:3px solid #e1ba3a;border-radius:8px;font-size:14px;color:#334155">${safe.message}</div>
          <p style="margin:24px 0 0">In the meantime, feel free to look around:</p>
          <p style="margin:12px 0 0">
            <a href="${site}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;background:#f3efea;color:#1e293b;border-radius:999px;text-decoration:none;font-weight:600">Portfolio</a>
            <a href="${github}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;border:1px solid #cbd5e1;color:#1e293b;border-radius:999px;text-decoration:none;font-weight:600">GitHub</a>
            <a href="${linkedin}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;border:1px solid #cbd5e1;color:#1e293b;border-radius:999px;text-decoration:none;font-weight:600">LinkedIn</a>
          </p>
          <p style="margin:28px 0 0;color:#0b1728">— ${escapeHtml(OWNER_NAME)}<br><a href="mailto:${OWNER_EMAIL}" style="color:#2f5f8f">${OWNER_EMAIL}</a></p>
        </div>
        <div style="padding:14px 32px;background:#f8fafc;color:#94a3b8;font-size:12px">If you didn't send this message, you can safely ignore this email.</div>
      </div>
    </div>`;

  return t.sendMail({
    from: fromAddress(),
    to: email,
    replyTo: OWNER_EMAIL,
    subject: `Thanks for reaching out, ${firstName} — ${OWNER_NAME}`,
    text,
    html,
    headers: { 'Auto-Submitted': 'auto-replied', 'X-Auto-Response-Suppress': 'All' },
  });
}
