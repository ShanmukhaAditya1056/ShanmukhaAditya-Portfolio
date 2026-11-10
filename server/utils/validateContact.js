const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const asString = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Validates and normalises a contact form payload.
 * Returns { data, errors } — errors is an object keyed by field name.
 */
export default function validateContact(body = {}) {
  const data = {
    name: asString(body.name),
    email: asString(body.email).toLowerCase(),
    subject: asString(body.subject),
    message: asString(body.message),
  };

  const errors = {};
  if (data.name.length < 2 || data.name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters.';
  }
  if (!EMAIL_RE.test(data.email) || data.email.length > 254) {
    errors.email = 'Please enter a valid email address.';
  }
  if (data.subject.length < 3 || data.subject.length > 150) {
    errors.subject = 'Subject must be between 3 and 150 characters.';
  }
  if (data.message.length < 10 || data.message.length > 5000) {
    errors.message = 'Message must be between 10 and 5000 characters.';
  }

  return { data, errors };
}
