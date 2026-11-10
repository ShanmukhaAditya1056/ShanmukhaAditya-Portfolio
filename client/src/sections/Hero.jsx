import { useEffect, useState } from 'react';
import { ArrowRight, Download, FileText, Send } from 'lucide-react';
import Page from '../components/Page.jsx';
import { profile } from '../data/profile.js';
import useTypeSequence from '../hooks/useTypeSequence.js';
import { box, u, useReducedMotion } from '../lib/u.js';

const ROLES = profile.roles.join(' · ');

// Typed in this order: name → roles → intro.
const SEGMENTS = [
  { key: 'name', text: profile.name, speed: 75, pause: 450 },
  { key: 'roles', text: ROLES, speed: 28, pause: 300 },
  { key: 'intro', text: profile.intro, speed: 14, pause: 0 },
];

function Caret({ show, size }) {
  return <span aria-hidden="true" className={`caret ${show ? '' : 'invisible'}`} style={{ height: size }} />;
}

function Buttons({ done, scaled }) {
  const radius = scaled ? u(12) : 12;
  const pad = scaled ? `${u(12)} ${u(22)}` : '12px 20px';
  const base = scaled ? { fontSize: u(16), lineHeight: u(22), padding: pad, borderRadius: radius } : { fontSize: 15, padding: pad, borderRadius: radius };
  const seg = scaled ? { padding: pad } : { padding: pad };
  const segIcon = scaled ? { padding: `0 ${u(14)}` } : { padding: '0 12px' };
  const icon = scaled ? { width: u(17), height: u(17) } : { width: 16, height: 16 };
  return (
    <div
      className={`flex flex-wrap transition-opacity duration-700 ${done ? 'opacity-100' : 'opacity-0'}`}
      style={scaled ? { gap: u(14) } : { gap: 10 }}
    >
      <a href="#projects" className="btn-cyan" style={base}>
        View Projects <ArrowRight style={icon} aria-hidden="true" />
      </a>
      <a href="#contact" className="btn-glass" style={base}>
        Contact Me <Send style={icon} aria-hidden="true" />
      </a>
      <div className="btn-split" style={{ fontSize: base.fontSize, lineHeight: base.lineHeight, borderRadius: radius }}>
        <a href={profile.resume} target="_blank" rel="noopener noreferrer" className="btn-split__seg" style={seg}>
          <FileText style={icon} aria-hidden="true" />
          Resume
          <span className="sr-only"> (view, opens in a new tab)</span>
        </a>
        <a
          href={profile.resume}
          download={profile.resumeFileName}
          className="btn-split__seg"
          style={segIcon}
          aria-label="Download resume"
          title="Download resume"
        >
          <Download style={icon} aria-hidden="true" />
        </a>
      </div>
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
      {/* Portrait: same spot as on the Canva page */}
      <img
        src={profile.portrait}
        alt={`Portrait of ${profile.name}`}
        width="1127"
        height="1396"
        fetchPriority="high"
        className="fade-up object-contain"
        style={{ ...box(555, 249, 410, 508), '--to': 0.57 }}
      />

      {/* Dark scrim so the text block reads over the flowers */}
      <div aria-hidden="true" className="scrim" style={box(0, 380, 820, 360)} />

      <h1
        aria-label={profile.name}
        className="whitespace-nowrap font-bold text-white"
        style={{ ...box(78, 440, 700), fontSize: u(56), lineHeight: 1 }}
      >
        {typed.name}
        <Caret show={activeKey === 'name'} size={u(50)} />
      </h1>

      <p
        className="whitespace-nowrap font-semibold uppercase text-linen"
        style={{ ...box(78, 519, 700), fontSize: u(15.5), lineHeight: u(22), letterSpacing: u(2.2), minHeight: u(22) }}
      >
        {typed.roles}
        <Caret show={activeKey === 'roles'} size={u(14)} />
      </p>

      <p className="text-left text-white" style={{ ...box(78, 556, 580), fontSize: u(18), lineHeight: u(26) }}>
        {typed.intro}
        <Caret show={activeKey === 'intro'} size={u(17)} />
      </p>

      <div style={box(78, 652, 700)}>
        <Buttons done={done} scaled />
      </div>
    </>
  );

  const mobile = (
    <>
      <img
        src={profile.portrait}
        alt={`Portrait of ${profile.name}`}
        width="1127"
        height="1396"
        fetchPriority="high"
        className="fade-up mx-auto -mb-2 mt-2 w-[62%] max-w-[300px] object-contain"
        style={{ '--to': 0.57 }}
      />
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
