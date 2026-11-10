import { useEffect, useState } from 'react';

/**
 * Design-unit helpers. The Canva page is a 1366×768 canvas scaled to the
 * viewport; `--u` (set in index.css) is one canvas pixel.
 */
export const u = (n) => `calc(var(--u) * ${n})`;

/** Absolute box in canvas coordinates. */
export const box = (x, y, w, h) => ({
  position: 'absolute',
  left: u(x),
  top: u(y),
  width: w == null ? undefined : u(w),
  height: h == null ? undefined : u(h),
});

function useMediaQuery(query, fallback) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? fallback : window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mq.addEventListener('change', onChange);
    setMatches(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** true on viewports wide enough for the exact canvas layout. */
export const useDesktop = () => useMediaQuery('(min-width: 900px)', true);

/** true when the visitor asked the OS for less motion. */
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)', false);
