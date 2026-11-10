import { useEffect, useState } from 'react';
import { ArrowRight, Send } from 'lucide-react';
import Page from '../components/Page.jsx';
import { profile } from '../data/profile.js';
import useTypeSequence from '../hooks/useTypeSequence.js';
import { box, u, useReducedMotion } from '../lib/u.js';

const ROLES = profile.roles.join(' · ');

// Typed in this order: name → roles → intro.
// ~3s in total: name 0.7s → roles 0.9s → intro 1.0s (plus short pauses).
const SEGMENTS = [
  { key: 'name', text: profile.name, speed: 45, pause: 250 },
  { key: 'roles', text: ROLES, speed: 18, pause: 200 },
  { key: 'intro', text: profile.intro, speed: 8, pause: 0 },
];

function Caret({ show, size }) {
  return <span aria-hidden="true" className={`caret ${show ? '' : 'invisible'}`} style={{ height: size }} />;
}

function Buttons({ done, scaled }) {
  const radius = scaled ? u(12) : 12;
  const pad = scaled ? `${u(12)} ${u(22)}` : '12px 20px';
  const base = scaled ? { fontSize: u(16), lineHeight: u(22), padding: pad, borderRadius: radius } : { fontSize: 15, padding: pad, borderRadius: radius };
  const icon = scaled ? { width: u(17), height: u(17) } : { width: 16, height: 16 };
  return (
    <div
      className={`flex flex-wrap transition-opacity duration-400 ${done ? 'opacity-100' : 'opacity-0'}`}
      style={scaled ? { gap: u(14) } : { gap: 10 }}
    >
      <a href="#projects" className="btn-cyan" style={base}>
        View Projects <ArrowRight style={icon} aria-hidden="true" />
      </a>
      <a href="#contact" className="btn-glass" style={base}>
        Contact Me <Send style={icon} aria-hidden="true" />
      </a>
    </div>
  );
}

/**
 * "Perseverance · Conquer · Mastery" exactly where they sit on the Canva page (canvas units).
 * Rendered before the portrait so the face overlaps "Conquer", as in the design.
 * `run` remounts the group so the clarify animation replays with the typewriter.
 */
// Curved "Conquer" arching over the portrait, as on the Canva page (box measured from the editor).
const CONQUER_BOX = box(525, 150, 477, 205);
const ARC = 'M 12 186 Q 238.5 -10 465 186'; // apex ≈ y 88 in the 477×205 viewBox

/**
 * "Conquer" on an SVG arc. `outline` renders the wireframe duplicate that sits in front of the portrait.
 * The <text> is aria-hidden for the outline copy so the word is announced once.
 */
function ConquerArc({ outline = false, className = '', style }) {
  const id = outline ? 'conquer-path-outline' : 'conquer-path';
  return (
    <svg
      viewBox="0 0 477 205"
      aria-hidden={outline ? 'true' : undefined}
      role={outline ? undefined : 'img'}
      aria-label={outline ? undefined : 'Conquer'}
      className={`conquer-arc ${outline ? 'conquer-arc--outline' : 'conquer-arc--fill'} ${className}`}
      style={style}
    >
      <defs>
        <path id={id} d={ARC} />
      </defs>
      <text fontSize="96" textAnchor="middle">
        <textPath href={`#${id}`} startOffset="50%">
          Conquer
        </textPath>
      </text>
    </svg>
  );
}

function Mantra({ run, scaled }) {
  if (scaled) {
    return (
      <div key={run} className="mantra-layer" style={box(0, 0, 1366, 768)}>
        <span className="mantra__side mantra__side--l" style={{ ...box(54, 402), fontSize: u(29.3), lineHeight: u(41) }}>
          Perseverance
        </span>
        <ConquerArc style={CONQUER_BOX} />
        <span className="mantra__side mantra__side--r text-center" style={{ ...box(1218, 402, 117), fontSize: u(29.3), lineHeight: u(41) }}>
          Mastery
        </span>
      </div>
    );
  }
  return (
    <div key={run} className="mantra-layer inset-0">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2">
        <span className="mantra__side mantra__side--l text-[12px]">Perseverance</span>
        <ConquerArc className="shrink-0" style={{ position: 'relative', width: 200, height: 86 }} />
        <span className="mantra__side mantra__side--r text-[12px]">Mastery</span>
      </div>
    </div>
  );
}

/** Foreground wireframe of "Conquer" (z-3): where the letters meet the hair, a faint outline traces across. */
function ConquerOutline({ run, scaled }) {
  if (scaled) return <ConquerArc key={run} outline style={CONQUER_BOX} />;
  return (
    <div key={run} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[3] flex items-center justify-between gap-2">
      <span className="invisible text-[12px]">Perseverance</span>
      <ConquerArc outline className="shrink-0" style={{ position: 'relative', width: 200, height: 86 }} />
      <span className="invisible text-[12px]">Mastery</span>
    </div>
  );
}

/** Increments each time the hero scrolls back into view, so the typing replays. */
function useReplayOnReturn(sectionId) {
  const [run, setRun] = useState(0);
  useEffect(() => {
    const el = document.getElementById(sectionId);
    if (!el) return undefined;
    let wasAway = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) wasAway = true;
        else if (wasAway) {
          wasAway = false;
          setRun((r) => r + 1);
        }
      },
      { threshold: 0.55 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sectionId]);
  return run;
}

export default function Hero() {
  const reduced = useReducedMotion();
  const run = useReplayOnReturn('home');
  const { typed, activeKey, done } = useTypeSequence(SEGMENTS, !reduced, run);

  const desktop = (
    <>
      <Mantra run={run} scaled />

      {/* Portrait: same spot as on the Canva page (painted above the mantra) */}
      <img
        src={profile.portrait}
        alt={`Portrait of ${profile.name}`}
        width="1127"
        height="1396"
        fetchPriority="high"
        className="fade-up portrait-fade object-contain"
        style={{ ...box(555, 249, 410, 508), '--to': 0.57, zIndex: 2 }}
      />
      <ConquerOutline run={run} scaled />

      {/* Dark scrim so the text block reads over the flowers */}
      <div aria-hidden="true" className="scrim" style={{ ...box(0, 430, 820, 338), zIndex: 3 }} />

      <h1
        aria-label={profile.name}
        className="whitespace-nowrap font-bold text-white"
        style={{ ...box(78, 492, 700), fontSize: u(56), lineHeight: 1, zIndex: 3 }}
      >
        {typed.name}
        <Caret show={activeKey === 'name'} size={u(50)} />
      </h1>

      <p
        className="whitespace-nowrap font-semibold uppercase text-linen"
        style={{ ...box(78, 566, 700), fontSize: u(15.5), lineHeight: u(22), letterSpacing: u(2.2), minHeight: u(22), zIndex: 3 }}
      >
        {typed.roles}
        <Caret show={activeKey === 'roles'} size={u(14)} />
      </p>

      <p className="text-left text-white" style={{ ...box(78, 600, 580), fontSize: u(18), lineHeight: u(26), zIndex: 3 }}>
        {typed.intro}
        <Caret show={activeKey === 'intro'} size={u(17)} />
      </p>

      <div style={{ ...box(78, 692, 700), zIndex: 3 }}>
        <Buttons done={done} scaled />
      </div>
    </>
  );

  const mobile = (
    <>
      <div className="relative">
        <Mantra run={run} />
        <img
          src={profile.portrait}
          alt={`Portrait of ${profile.name}`}
          width="1127"
          height="1396"
          fetchPriority="high"
          className="fade-up portrait-fade relative z-[2] mx-auto -mb-2 mt-[72px] w-[62%] max-w-[300px] object-contain"
          style={{ '--to': 0.57 }}
        />
        <ConquerOutline run={run} />
      </div>
      <div className="scrim-m -mx-4 px-4 pb-6 pt-8">
        <h1 aria-label={profile.name} className="min-h-[84px] text-[40px] font-bold leading-[1.05] text-white">
          {typed.name}
          <Caret show={activeKey === 'name'} size="34px" />
        </h1>
        <p className="mt-4 min-h-[40px] text-[12.5px] font-semibold uppercase leading-[1.5] tracking-[0.12em] text-linen">
          {typed.roles}
          <Caret show={activeKey === 'roles'} size="12px" />
        </p>
        <p className="mt-4 min-h-[96px] text-[17px] leading-[1.45] text-white">
          {typed.intro}
          <Caret show={activeKey === 'intro'} size="16px" />
        </p>
        <div className="mt-6">
          <Buttons done={done} />
        </div>
      </div>
    </>
  );

  return (
    <Page id="home" label="Home" mobile={mobile}>
      {desktop}
    </Page>
  );
}
