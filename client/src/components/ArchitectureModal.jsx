import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Copy, GitBranch, ShieldCheck, Terminal, X } from 'lucide-react';

const TABS = [
  { id: 'flow', label: 'System Flow', icon: GitBranch },
  { id: 'decisions', label: 'Security & Engineering', icon: ShieldCheck },
  { id: 'code', label: 'Production Snippet', icon: Terminal },
];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea';

/* ---------- Tab 1: interactive pipeline diagram ---------- */

function Connector({ index }) {
  return (
    <div aria-hidden="true" className="relative flex shrink-0 items-center justify-center self-stretch md:w-10 md:self-auto">
      {/* track: vertical on phones, horizontal from md */}
      <span className="absolute left-1/2 h-7 w-px -translate-x-1/2 bg-white/25 md:left-0 md:top-1/2 md:h-px md:w-full md:-translate-y-1/2 md:translate-x-0" />
      {/* travelling request packet */}
      <motion.span
        className="absolute left-1/2 top-[var(--p)] size-2 rounded-full bg-linen shadow-[0_0_10px_2px_rgba(243,239,234,0.55)] md:left-[var(--p)] md:top-1/2"
        initial={false}
        animate={{ '--p': ['0%', '100%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.35, repeatDelay: 0.6 }}
        style={{ '--p': '0%', translateX: '-50%', translateY: '-50%' }}
      />
      <ArrowRight className="relative hidden size-3.5 text-white/60 md:block" />
    </div>
  );
}

function SystemFlow({ nodes, baseId }) {
  const [selected, setSelected] = useState(0);
  const current = nodes[selected];
  return (
    <div>
      <ol className="flex flex-col items-stretch md:flex-row md:items-center" aria-label="Request pipeline">
        {nodes.map((node, i) => {
          const active = i === selected;
          return (
            <li key={node.label} className="contents">
              {i > 0 && <Connector index={i - 1} />}
              <button
                type="button"
                onClick={() => setSelected(i)}
                onMouseEnter={() => setSelected(i)}
                onFocus={() => setSelected(i)}
                aria-pressed={active}
                aria-describedby={`${baseId}-flow-detail`}
                className={`relative flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold leading-snug transition md:block md:min-w-0 md:flex-1 md:text-center ${
                  active
                    ? 'border-linen/80 bg-linen/15 text-white shadow-[0_0_0_1px_rgba(243,239,234,0.35)]'
                    : 'border-white/20 bg-white/5 text-white/85 hover:border-white/45 hover:bg-white/10'
                }`}
              >
                <span className="mt-0.5 shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] leading-none text-white/60 md:absolute md:-top-2.5 md:left-2 md:mt-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{node.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div
        id={`${baseId}-flow-detail`}
        role="status"
        aria-live="polite"
        className="mt-5 rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-[14px] leading-relaxed text-white/90"
      >
        <span className="mr-2 font-mono text-[11px] uppercase tracking-wider text-linen/90">Stage {selected + 1}</span>
        {current.detail}
      </div>
    </div>
  );
}

/* ---------- Tab 2: decisions ---------- */

function Decisions({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((text, i) => (
        <li key={i} className="flex gap-3 rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-[14px] leading-relaxed text-white/90">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-linen" aria-hidden="true" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Tab 3: code snippet with lightweight highlighting ---------- */

const TOKEN =
  /(\/\/.*$)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:const|let|var|function|return|async|await|import|export|from|default|if|else|for|of|in|new|throw|try|catch|finally|class|extends|this|typeof|null|undefined|true|false|break|continue|while|switch|case|unknown|string)\b)/g;

function highlightLine(line, key) {
  const out = [];
  let last = 0;
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const cls = m[1] ? 'italic text-slate-400' : m[2] ? 'text-emerald-300' : m[3] ? 'text-amber-300' : 'text-sky-300';
    out.push(
      <span key={`${key}-${m.index}`} className={cls}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

function CodeSnippet({ snippet }) {
  const [copied, setCopied] = useState(false);
  const lines = snippet.code.split('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = snippet.code;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/15 bg-[#0b1220]/90">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="flex gap-1.5">
            <i className="size-2.5 rounded-full bg-[#ff5f57]" />
            <i className="size-2.5 rounded-full bg-[#febc2e]" />
            <i className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="truncate font-mono text-[12px] text-white/70">{snippet.filename}</span>
          <span className="hidden rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-white/60 sm:inline">{snippet.language}</span>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-live="polite"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[12px] font-semibold text-white transition hover:border-linen hover:bg-white/20"
        >
          {copied ? <Check className="size-3.5 text-emerald-300" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy Code'}
        </button>
      </div>
      <pre className="overflow-x-auto px-1 py-3 font-mono text-[12.5px] leading-[1.6] text-slate-100" tabIndex={0}>
        <code>
          {lines.map((line, i) => (
            <span key={i} className="flex">
              <span aria-hidden="true" className="w-9 shrink-0 select-none pr-3 text-right text-white/30">
                {i + 1}
              </span>
              <span className="whitespace-pre">{highlightLine(line, i)}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

/* ---------- Modal shell ---------- */

/**
 * Accessible "View Architecture" dialog. Rendered in a portal above the petal layer and navbar.
 * Esc / backdrop click close it, focus is trapped inside and returned to the trigger, and the page
 * cannot scroll while it is open. Enter/exit transitions follow the site's reduced-motion setting.
 */
export default function ArchitectureModal({ open, onClose, project, data }) {
  const baseId = useId();
  const panelRef = useRef(null);
  const [tab, setTab] = useState('flow');

  // Reset to the first tab each time the dialog opens.
  useEffect(() => {
    if (open) setTab('flow');
  }, [open]);

  // Scroll lock + key handling + focus management while open.
  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const focusables = () => Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) ?? []);
    const raf = requestAnimationFrame(() => focusables()[0]?.focus());

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = focusables();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const inside = panelRef.current?.contains(document.activeElement);
      if (!inside) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  const onTabKey = useCallback(
    (e) => {
      const idx = TABS.findIndex((t) => t.id === tab);
      let next = idx;
      if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
      else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = TABS.length - 1;
      else return;
      e.preventDefault();
      setTab(TABS[next].id);
      document.getElementById(`${baseId}-tab-${TABS[next].id}`)?.focus();
    },
    [tab, baseId]
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && data && (
        <motion.div
          key="arch-backdrop"
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[#07122a]/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${baseId}-title`}
            aria-describedby={`${baseId}-desc`}
            className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/20 bg-slate-900/75 text-white shadow-2xl backdrop-blur-xl sm:max-h-[86vh] sm:rounded-2xl"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/12 px-5 pb-4 pt-5 sm:px-6">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-linen/90">Architecture</p>
                <h2 id={`${baseId}-title`} className="mt-1 truncate text-[20px] font-bold leading-tight sm:text-[22px]">
                  {project.title}
                </h2>
                <p id={`${baseId}-desc`} className="mt-1 text-[13.5px] text-white/75">
                  {data.tagline}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close architecture dialog"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:border-linen hover:bg-white/20"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {/* Tabs */}
            <div role="tablist" aria-label="Architecture views" className="flex flex-wrap gap-1.5 border-b border-white/12 px-4 py-3 sm:px-6" onKeyDown={onTabKey}>
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    id={`${baseId}-tab-${id}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`${baseId}-panel-${id}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setTab(id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                      active ? 'border-linen bg-linen text-ink-text' : 'border-white/20 bg-white/5 text-white/85 hover:border-white/45 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Panel */}
            <div id={`${baseId}-panel-${tab}`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`} className="overflow-y-auto px-4 py-5 sm:px-6">
              {tab === 'flow' && <SystemFlow nodes={data.nodes} baseId={baseId} />}
              {tab === 'decisions' && <Decisions items={data.decisions} />}
              {tab === 'code' && <CodeSnippet snippet={data.snippet} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
