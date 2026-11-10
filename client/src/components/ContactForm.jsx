import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { suggestEmail } from '../lib/emailTypos.js';
import { u } from '../lib/u.js';

const INITIAL = { name: '', email: '', subject: '', message: '', company_website: '' };

// Anti-bot timing: humans need at least this long to fill four fields.
const MIN_FILL_MS = 2500;
// One message per 30 seconds per browser.
const COOLDOWN_MS = 30_000;
const COOLDOWN_KEY = 'contact:lastSentAt';

const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const TAG_RE = /<\/?[a-z!?][^>]*>/i;
const CRLF_RE = /[\r\n]/;

const stripCRLF = (s) => s.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

/** Mirrors server/utils/contactSchema.js. Returns { clean, errors }. */
function validate(v) {
  const clean = {
    name: stripCRLF(v.name),
    email: v.email.trim(),
    subject: stripCRLF(v.subject),
    message: v.message.replace(/\r\n?/g, '\n').trim(),
    company_website: v.company_website,
  };
  const errors = {};
  if (clean.name.length < 2 || clean.name.length > 80) errors.name = 'Please enter your name (2–80 characters).';
  else if (TAG_RE.test(clean.name)) errors.name = 'Name cannot contain HTML.';

  if (CRLF_RE.test(clean.email)) errors.email = 'Email cannot contain line breaks.';
  else if (clean.email.length > 100 || !EMAIL_RE.test(clean.email) || /\.\./.test(clean.email)) errors.email = 'Please enter a valid email address.';

  if (clean.subject.length < 3 || clean.subject.length > 120) errors.subject = 'Subject must be 3–120 characters.';
  else if (TAG_RE.test(clean.subject)) errors.subject = 'Subject cannot contain HTML.';

  if (clean.message.length < 10 || clean.message.length > 2000) errors.message = 'Message must be 10–2000 characters.';
  return { clean, errors };
}

const readCooldown = () => {
  try {
    const t = Number(localStorage.getItem(COOLDOWN_KEY));
    return Number.isFinite(t) ? Math.max(0, t + COOLDOWN_MS - Date.now()) : 0;
  } catch {
    return 0;
  }
};
const writeCooldown = () => {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    /* private mode — cooldown simply won't persist */
  }
};

// Defined at module level so React keeps the same input mounted (and focused) across re-renders.
// Error / hint captions are absolutely positioned under the field so they never shift the layout.
function Field({ id, label, error, hint, counter, styles, as = 'input', className = 'input', ...props }) {
  const Tag = as;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="relative">
      <label htmlFor={id} className="block font-slab uppercase text-white" style={styles.label}>
        {label}
      </label>
      <div className="relative">
        <Tag id={id} name={id} aria-invalid={error ? 'true' : 'false'} aria-describedby={describedBy} className={className} style={styles.input} {...props} />
        {counter && (
          <span aria-hidden="true" className="pointer-events-none absolute font-slab tabular-nums text-white/50" style={styles.counter}>
            {counter}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="absolute left-0 top-full truncate text-[#ffd3d3]" style={styles.caption}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="absolute left-0 top-full truncate text-cream/90" style={styles.caption}>
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * `scaled` = desktop canvas (sizes in design units); otherwise mobile rem sizes.
 */
export default function ContactForm({ scaled = false }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [suggestion, setSuggestion] = useState(null);
  const mountTimestamp = useRef(Date.now());

  // Cooldown countdown (persisted in localStorage so a reload doesn't reset it).
  useEffect(() => {
    setCooldownLeft(readCooldown());
    const t = setInterval(() => setCooldownLeft(readCooldown()), 1000);
    return () => clearInterval(t);
  }, []);

  const s = scaled
    ? {
        label: { fontSize: u(13), lineHeight: u(18), letterSpacing: u(1.2), marginBottom: u(6) },
        input: { fontSize: u(16), lineHeight: u(22), padding: `${u(10)} ${u(14)}` },
        caption: { fontSize: u(11.5), lineHeight: u(14), marginTop: u(1), maxWidth: '100%' },
        counter: { fontSize: u(11), lineHeight: u(14), right: u(12), bottom: u(8) },
        gap: { gap: u(14) },
        button: { fontSize: u(16), lineHeight: u(22), padding: `${u(12)} ${u(28)}`, marginTop: u(4) },
        icon: { width: u(16), height: u(16) },
      }
    : {
        label: { fontSize: 12, lineHeight: '16px', letterSpacing: '0.1em', marginBottom: 6 },
        input: { fontSize: 16, lineHeight: '22px', padding: '11px 14px' },
        caption: { fontSize: 12, lineHeight: '14px', marginTop: 1, maxWidth: '100%' },
        counter: { fontSize: 11, lineHeight: '14px', right: 12, bottom: 8 },
        gap: { gap: 14 },
        button: { fontSize: 16, padding: '12px 26px', marginTop: 4 },
        icon: { width: 17, height: 17 },
      };

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
    if (name === 'email') setSuggestion(null);
  };

  const onEmailBlur = () => setSuggestion(suggestEmail(values.email.trim()));

  const applySuggestion = () => {
    setValues((v) => ({ ...v, email: suggestion }));
    setSuggestion(null);
    setErrors(({ email: _e, ...rest }) => rest);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const left = readCooldown();
    if (left > 0) {
      toast.error(`Please wait ${Math.ceil(left / 1000)}s before sending another message.`);
      return;
    }

    // Honeypot: humans never see or fill this field.
    if (values.company_website.trim() !== '') {
      toast.success("Thanks! Your message is on its way — I'll reply soon.");
      setValues(INITIAL);
      return;
    }

    // Time-to-submit guard: four fields in under 2.5s is a bot (or paste-everything autofill — ask once).
    if (Date.now() - mountTimestamp.current < MIN_FILL_MS) {
      toast.error('That was quick — please take a second to review your message and send again.');
      mountTimestamp.current = Date.now() - MIN_FILL_MS; // next attempt goes through
      return;
    }

    const { clean, errors: found } = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Please fix the highlighted fields.');
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Sending your message…');
    try {
      await api.post('/api/contact', clean);
      writeCooldown();
      setCooldownLeft(COOLDOWN_MS);
      toast.success("Thanks! Your message is on its way — I'll reply soon.", { id: toastId });
      setValues(INITIAL);
      setErrors({});
      setSuggestion(null);
    } catch (err) {
      const res = err.response;
      if (res?.status === 400) {
        const fieldErrs = res.data?.errors ?? (res.data?.error ? { email: res.data.error } : {});
        setErrors(fieldErrs);
        toast.error(res.data?.error || 'Please fix the highlighted fields.', { id: toastId });
        document.getElementById(Object.keys(fieldErrs)[0] || 'email')?.focus();
      } else if (res?.status === 429) {
        toast.error(res.data?.error || 'Too many messages — please try again later.', { id: toastId });
      } else if (res?.status === 403) {
        toast.error('This form can only be submitted from the portfolio site.', { id: toastId });
      } else if (!res) {
        toast.error('Network error — please check your connection and try again.', { id: toastId });
      } else {
        toast.error(res.data?.error || 'Could not send right now. Please email me directly.', { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const common = (id) => ({ id, error: errors[id], styles: s, value: values[id], onChange, required: true });
  const locked = isSubmitting || cooldownLeft > 0;

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Contact form" className="relative flex flex-col" style={s.gap}>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={s.gap}>
        <Field {...common('name')} label="Name" autoComplete="name" placeholder="Your name" maxLength={80} />
        <Field
          {...common('email')}
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          maxLength={100}
          onBlur={onEmailBlur}
          hint={
            suggestion && (
              <>
                Did you mean{' '}
                <button type="button" onClick={applySuggestion} className="font-semibold underline underline-offset-2 hover:text-white">
                  @{suggestion.split('@')[1]}
                </button>
                ?
              </>
            )
          }
        />
      </div>
      <Field {...common('subject')} label="Subject" placeholder="What would you like to discuss?" maxLength={120} />
      <Field
        {...common('message')}
        label="Message"
        as="textarea"
        rows={scaled ? 3 : 6}
        placeholder="Tell me about your project, role, or idea…"
        maxLength={2000}
        className="input resize-none"
        counter={`${values.message.length} / 2000`}
      />

      {/* Honeypot — zero layout footprint (absolute, 1×1, off-screen), untabbable, hidden from assistive tech */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', top: 0, width: 1, height: 1, overflow: 'hidden', margin: 0, padding: 0 }}
      >
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" value={values.company_website} onChange={onChange} />
      </div>

      <div>
        <button
          type="submit"
          disabled={locked}
          aria-busy={isSubmitting}
          aria-live="polite"
          className={`btn-cyan rounded-full ${cooldownLeft > 0 && !isSubmitting ? 'is-sent' : ''}`}
          style={s.button}
        >
          {isSubmitting ? (
            <>
              <Loader2 style={s.icon} className="animate-spin" aria-hidden="true" /> Sending…
            </>
          ) : cooldownLeft > 0 ? (
            <>
              <Check style={s.icon} aria-hidden="true" /> Message sent
              <span className="opacity-60"> · {Math.ceil(cooldownLeft / 1000)}s</span>
            </>
          ) : (
            <>
              Send Message <Send style={s.icon} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
