import { box, u, useDesktop } from '../lib/u.js';

/** Centered section heading used on the Skills / Projects / Contact pages. */
export function PageHeading({ children, id }) {
  return (
    <h2
      id={id}
      className="whitespace-nowrap text-center font-bold uppercase text-white"
      style={{ ...box(0, 150, 1366), fontSize: u(29.2), lineHeight: u(36), letterSpacing: u(5.4) }}
    >
      {children}
    </h2>
  );
}

/**
 * One Canva page: viewport-filling section over the shared fixed background, holding the content layer.
 * `children` is the exact desktop canvas; `mobile` is the stacked fallback.
 */
export default function Page({ id, label, children, mobile }) {
  const desktop = useDesktop();
  const first = id === 'home';

  return (
    <section
      id={id}
      aria-label={label}
      className={`page ${desktop ? 'page--desktop' : ''} ${desktop && first ? 'page--first' : ''}`}
    >
      {desktop ? <div className="canvas">{children}</div> : <div className="mpage">{mobile ?? children}</div>}
    </section>
  );
}
