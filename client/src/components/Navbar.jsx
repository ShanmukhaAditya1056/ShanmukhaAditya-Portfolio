import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Menu, Send, X } from 'lucide-react';
import { navItems, profile } from '../data/profile.js';
import useScrollSpy from '../hooks/useScrollSpy.js';

const SECTION_IDS = navItems.map((item) => item.id);

/** Frosted pill of links with a highlight that slides to the active one. */
function PillNav({ active }) {
  const listRef = useRef(null);
  const [ind, setInd] = useState({ left: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const update = () => {
      const el = listRef.current?.querySelector(`[data-id="${active}"]`);
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    };
    update();
    document.fonts?.ready.then(update);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [active]);

  return (
    <nav aria-label="Primary" className="pillnav hidden min-[900px]:block">
      <ul ref={listRef} className="relative flex items-center gap-1 p-1.5">
        <span
          aria-hidden="true"
          className="pillnav-ind"
          style={{ transform: `translateX(${ind.left}px)`, width: ind.width, opacity: ind.ready ? 1 : 0 }}
        />
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                data-id={item.id}
                aria-current={isActive ? 'location' : undefined}
                className={`relative z-10 block rounded-full px-5 py-2 text-[15px] font-medium transition-colors duration-300 ${
                  isActive ? 'text-linen' : 'text-white/80 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function Navbar() {
  const active = useScrollSpy(SECTION_IDS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth >= 900 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1366px] items-center justify-between px-5 pt-4 min-[900px]:px-[6.4%] min-[900px]:pt-5">
        <a href="#home" className="font-logo text-[28px] font-bold leading-none text-sky drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-[32px]">
          {profile.brand}
        </a>

        <PillNav active={active} />

        <div className="hidden min-[900px]:block">
          <a href="#contact" className="btn-cyan rounded-full px-5 py-2.5 text-[15px]">
            Let&apos;s talk <Send size={15} aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          className="glass-btn grid size-11 place-items-center rounded-full text-white min-[900px]:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Primary" className="glass-card mx-4 mt-3 p-2 min-[900px]:hidden">
          <ul className="flex flex-col">
            {navItems.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? 'location' : undefined}
                    className={`block rounded-xl px-4 py-3 text-[17px] font-medium ${
                      isActive ? 'bg-white/12 text-linen' : 'text-white/85'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
            <li className="p-2 pt-3">
              <a href="#contact" onClick={() => setOpen(false)} className="btn-cyan w-full rounded-full px-5 py-3 text-[15px]">
                Let&apos;s talk <Send size={15} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
