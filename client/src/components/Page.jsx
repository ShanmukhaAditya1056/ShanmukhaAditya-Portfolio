import { profile } from '../data/profile.js';
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
 * One Canva page: viewport-filling section with the floral background,
 * the content layer and the gold signature.
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
      {desktop ? (
        <>
          {/* Background photo, positioned by .bgphoto in index.css relative to the page. */}
          <img src={profile.background} alt="" aria-hidden="true" width="1023" height="767" className="bgphoto" />
          <div className="canvas">
            {children}
            <img
              src={profile.signature}
              alt=""
              aria-hidden="true"
              width="800"
              height="206"
              className="pointer-events-none select-none"
              style={box(991, 645, 302, 78)}
            />
          </div>
        </>
      ) : (
        <div className="mpage">
          {mobile ?? children}
          <img src={profile.signature} alt="" aria-hidden="true" width="800" height="206" className="msig" />
        </div>
      )}
    </section>
  );
}
