import { useEffect, useState } from 'react';
import { profile } from '../data/profile.js';

/**
 * The address is stored in pieces in profile.js and only joined at runtime, so the
 * full "user@domain.tld" string never appears contiguously in the HTML or JS bundle
 * where scrapers regex for it. Visitors see and copy exactly the same address.
 */
export function assembleEmail() {
  const { user, domain, tld } = profile.emailParts;
  return [user, String.fromCharCode(64), domain, '.', tld].join('');
}

/** Returns '' on the first render and the real address after mount (client-side only). */
export function useContactEmail() {
  const [email, setEmail] = useState('');
  useEffect(() => {
    setEmail(assembleEmail());
  }, []);
  return email;
}
