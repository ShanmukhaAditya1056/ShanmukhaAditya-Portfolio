import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { u } from '../lib/u.js';

const INITIAL = { name: '', email: '', subject: '', message: '', website: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Mirrors server/utils/validateContact.js
function validate(v) {
  const errors = {};
  const name = v.name.trim();
  const subject = v.subject.trim();
  const message = v.message.trim();
  if (name.length < 2 || name.length > 100) errors.name = 'Please enter your name (2–100 characters).';
  if (!EMAIL_RE.test(v.email.trim())) errors.email = 'Please enter a valid email address.';
  if (subject.length < 3 || subject.length > 150) errors.subject = 'Subject must be 3–150 characters.';
  if (message.length < 10 || message.length > 5000) errors.message = 'Message must be 10–5000 characters.';
  return errors;
}

// Defined at module level so React keeps the same input mounted (and focused) across re-renders.
function Field({ id, label, error, styles, as = 'input', className = 'input', ...props }) {
  const Tag = as;
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="block font-slab uppercase text-white" style={styles.label}>
        {label}
      </label>
      <Tag
        id={id}
        name={id}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className={className}
        style={styles.input}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-[#ffd3d3]" style={styles.error}>
          {error}
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
  const [loading, setLoading] = useState(false);

  const s = scaled
    ? {
        label: { fontSize: u(13), lineHeight: u(18), letterSpacing: u(1.2), marginBottom: u(6) },
        input: { fontSize: u(16), lineHeight: u(22), padding: `${u(10)} ${u(14)}` },
        error: { fontSize: u(12.5), lineHeight: u(16), marginTop: u(4) },
        gap: { gap: u(14) },
        button: { fontSize: u(16), lineHeight: u(22), padding: `${u(12)} ${u(28)}`, marginTop: u(4) },
        icon: { width: u(16), height: u(16) },
      }
    : {
        label: { fontSize: 12, lineHeight: '16px', letterSpacing: '0.1em', marginBottom: 6 },
        input: { fontSize: 16, lineHeight: '22px', padding: '11px 14px' },
        error: { fontSize: 13, marginTop: 4 },
        gap: { gap: 14 },
        button: { fontSize: 16, padding: '12px 26px', marginTop: 4 },
        icon: { width: 17, height: 17 },
      };

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Please fix the highlighted fields.');
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Sending your message…');
    try {
      await api.post('/api/contact', values);
      toast.success("Thanks! Your message is on its way — I'll reply soon.", { id: toastId });
      setValues(INITIAL);
      setErrors({});
    } catch (err) {
      const res = err.response;
      if (res?.status === 400 && res.data?.errors) {
        setErrors(res.data.errors);
        toast.error('Please fix the highlighted fields.', { id: toastId });
      } else if (!res) {
        toast.error('Network error — please check your connection and try again.', { id: toastId });
      } else {
        toast.error(res.data?.message || 'Could not send right now. Please email me directly.', { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  const common = (id) => ({ id, error: errors[id], styles: s, value: values[id], onChange, required: true });

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Contact form" className="flex flex-col" style={s.gap}>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={s.gap}>
        <Field {...common('name')} label="Name" autoComplete="name" placeholder="Your name" maxLength={100} />
        <Field {...common('email')} label="Email" type="email" autoComplete="email" placeholder="you@company.com" maxLength={254} />
      </div>
      <Field {...common('subject')} label="Subject" placeholder="What would you like to discuss?" maxLength={150} />
      <Field
        {...common('message')}
        label="Message"
        as="textarea"
        rows={scaled ? 3 : 6}
        placeholder="Tell me about your project, role, or idea…"
        maxLength={5000}
        className="input resize-none"
      />

      {/* Honeypot — display:none keeps it out of the visual flow and the accessibility tree; naive bots still fill it */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={onChange} />
      </div>

      <div>
        <button type="submit" disabled={loading} className="btn-cyan rounded-full" style={s.button}>
          {loading ? (
            <>
              <Loader2 style={s.icon} className="animate-spin" aria-hidden="true" /> Sending…
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
