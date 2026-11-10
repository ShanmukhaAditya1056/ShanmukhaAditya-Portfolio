import { useEffect, useState } from 'react';

/**
 * Returns the id of the section currently crossing the upper-middle of the viewport.
 * `ids` must be a stable array (define it outside the component).
 */
export default function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -59% 0px', threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));

    // The last section may never reach the trigger line on tall screens.
    const onScroll = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) setActive(ids[ids.length - 1]);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [ids]);

  return active;
}
