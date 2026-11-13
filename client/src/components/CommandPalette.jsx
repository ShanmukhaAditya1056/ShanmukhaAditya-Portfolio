import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Briefcase, Compass, Copy, CornerDownLeft, ExternalLink, FileText, FolderGit2, Home, Layers, Lightbulb, Mail, Search, User } from 'lucide-react';
import { GitHubIcon, LinkedInIcon } from './BrandIcons.jsx';
import { profile } from '../data/profile.js';
import { projectArchitecture } from '../data/projectArchitectureData.js';
import localProjects from '../../../shared/projects.json';
import { assembleEmail } from '../lib/contactEmail.js';

/* ---------- events shared with the navbar and project cards ---------- */

export const OPEN_PALETTE_EVENT = 'portfolio:open-command-palette';
export const OPEN_ARCHITECTURE_EVENT = 'portfolio:open-architecture';

/** Open the palette from anywhere (navbar trigger pill, etc.). */
export const openCommandPalette = () => window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));

/** Scroll a section into view and ask its project card to open the architecture dialog. */
function openArchitecture(projectId) {
  document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Let the scroll start before the dialog takes focus, so the card is visible behind it.
  setTimeout(() => window.dispatchEvent(new CustomEvent(OPEN_ARCHITECTURE_EVENT, { detail: { id: projectId } })), 350);
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const MOD_KEY = isMac ? '⌘' : 'Ctrl';

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (history.replaceState) history.replaceState(null, '', `#${id}`);
};
const openExternal = (url) => window.open(url, '_blank', 'noopener,noreferrer');

const SECTION_ICONS = { home: Home, about: User, skills: Lightbulb, experience: Briefcase, projects: FolderGit2, contact: Mail };
const SECTION_LABELS = { home: 'Home', about: 'About Me', skills: 'Skills', experience: 'Experience & Certifications', projects: 'Projects', contact: 'Contact' };
const ARCH_LABELS = { 'cyberguard-ai': 'CyberGuard AI', 'mulegraph-ai': 'MuleGraph AI', 'multi-college-library': 'Library System', 'devtrack-se-platform': 'DevTrack' };

/** Builds the command list once; projects come from the bundled data so the palette works offline. */
function buildCommands() {
  const email = assembleEmail();
  const groups = [];

  groups.push({
    title: 'Quick Actions',
    items: [
      {
        id: 'resume',
        label: 'View / Download Resume (PDF)',
        hint: 'Opens in a new tab',
        keywords: 'cv pdf download',
        Icon: FileText,
        run: () => openExternal(profile.resume),
      },
      {
        id: 'copy-email',
        label: 'Copy Email Address',
        hint: email,
        keywords: 'mail contact clipboard',
        Icon: Copy,
        run: async () => {
          try {
            await navigator.clipboard.writeText(email);
            toast.success('Copied!');
          } catch {
            toast.error('Could not copy — the address is in the Contact section.');
          }
        },
      },
    ],
  });

  groups.push({
    title: 'Navigate to Section',
    items: Object.keys(SECTION_LABELS).map((id) => ({
      id: `go-${id}`,
      label: `Go to ${SECTION_LABELS[id]}`,
      keywords: `section jump scroll ${id}`,
      Icon: SECTION_ICONS[id],
      run: () => scrollTo(id),
    })),
  });

  const archItems = localProjects
    .filter((p) => projectArchitecture[p.id])
    .map((p) => ({
      id: `arch-${p.id}`,
      label: `Inspect ${ARCH_LABELS[p.id] || p.title} Architecture`,
      hint: 'System flow · decisions · code',
      keywords: `${p.title} ${p.stack.join(' ')} diagram`,
      Icon: Layers,
      run: () => openArchitecture(p.id),
    }));
  localProjects
    .filter((p) => p.demoUrl)
    .forEach((p) =>
      archItems.push({
        id: `demo-${p.id}`,
        label: `Launch ${ARCH_LABELS[p.id] || p.title} Live Demo`,
        hint: p.demoUrl.replace(/^https?:\/\//, ''),
        keywords: `${p.title} deploy site`,
        Icon: ExternalLink,
        run: () => openExternal(p.demoUrl),
      })
    );
  groups.push({ title: 'Project Architecture Deep-Dives', items: archItems });

  groups.push({
    title: 'External Profiles',
    items: [
      { id: 'github', label: `Open GitHub (@${profile.github.split('/').pop()})`, hint: 'github.com', keywords: 'code repos', Icon: GitHubIcon, run: () => openExternal(profile.github) },
      { id: 'linkedin', label: 'Open LinkedIn', hint: 'linkedin.com', keywords: 'profile network', Icon: LinkedInIcon, run: () => openExternal(profile.linkedin) },
    ],
  });

  return groups;
}

/** 0 = label starts with the query, 1 = label contains it, 2 = hint/keywords only, -1 = no match. */
function score(item, q) {
  if (!q) return 1;
  const label = item.label.toLowerCase();
  if (label.startsWith(q)) return 0;
  if (label.includes(q)) return 1;
  if (`${item.hint || ''} ${item.keywords || ''}`.toLowerCase().includes(q)) return 2;
  return -1;
}

/**
 * Ctrl/⌘ + K command palette. Frosted glass, instant filtering, full keyboard control,
 * body scroll lock, Esc / backdrop close. Rendered in a portal above everything else.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const baseId = useId();
  const groups = useMemo(buildCommands, []);

  const q = query.trim().toLowerCase();
  // Browsing: grouped. Searching: one ranked list (best label matches first), each row tagged with its group.
  const visible = useMemo(() => {
    if (!q) return groups;
    const ranked = groups
      .flatMap((g) => g.items.map((item) => ({ ...item, group: g.title, score: score(item, q) })))
      .filter((i) => i.score >= 0)
      .sort((a, b) => a.score - b.score);
    return ranked.length ? [{ title: 'Results', items: ranked }] : [];
  }, [groups, q]);
  const flat = useMemo(() => visible.flatMap((g) => g.items), [visible]);
  const activeId = flat[cursor]?.id;

  const close = useCallback(() => setOpen(false), []);

  // Global shortcut + navbar trigger event.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  // Reset, focus, and lock the page while open.
  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setCursor(0);
    const previouslyFocused = document.activeElement;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  // Keep the cursor valid as the filter changes and keep the active row in view.
  useEffect(() => {
    setCursor(0);
  }, [q]);
  useEffect(() => {
    if (!activeId) return;
    listRef.current?.querySelector(`[data-id="${activeId}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  const run = useCallback(
    (item) => {
      if (!item) return;
      close();
      // Run after the palette has released focus/scroll lock so smooth scrolling works.
      setTimeout(() => item.run(), 30);
    },
    [close]
  );

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (flat.length ? (c + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (flat.length ? (c - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Home' && flat.length) {
      e.preventDefault();
      setCursor(0);
    } else if (e.key === 'End' && flat.length) {
      e.preventDefault();
      setCursor(flat.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(flat[cursor]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette-backdrop"
          className="fixed inset-0 z-[90] flex items-start justify-center bg-[#07122a]/55 px-4 pt-[12vh] backdrop-blur-sm sm:pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-900/80 text-white shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
            onKeyDown={onKeyDown}
          >
            {/* Search */}
            <div className="flex items-center gap-3 border-b border-white/12 px-4 py-3">
              <Search className="size-[18px] shrink-0 text-white/60" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={`${baseId}-list`}
                aria-activedescendant={activeId ? `${baseId}-${activeId}` : undefined}
                aria-autocomplete="list"
                aria-label="Search commands"
                placeholder="Type a command or search…"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/70 transition hover:bg-white/20 hover:text-white"
                aria-label="Close command palette"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} id={`${baseId}-list`} role="listbox" aria-label="Commands" className="max-h-[min(60vh,420px)] overflow-y-auto py-2">
              {flat.length === 0 && (
                <p className="px-4 py-8 text-center text-[14px] text-white/60" role="status">
                  No commands match “{query}”.
                </p>
              )}
              {visible.map((group) => (
                <div key={group.title} role="group" aria-label={group.title}>
                  <p className="px-4 pb-1 pt-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-linen/85">{group.title}</p>
                  {group.items.map((item) => {
                    const active = item.id === activeId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        id={`${baseId}-${item.id}`}
                        data-id={item.id}
                        aria-selected={active}
                        tabIndex={-1}
                        onMouseEnter={() => setCursor(flat.indexOf(item))}
                        onClick={() => run(item)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${active ? 'bg-linen/15 text-white' : 'text-white/85 hover:bg-white/8'}`}
                      >
                        <span className={`grid size-8 shrink-0 place-items-center rounded-lg border ${active ? 'border-linen/60 bg-linen/15 text-linen' : 'border-white/15 bg-white/5 text-white/70'}`}>
                          <item.Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium">{item.label}</span>
                          {item.hint && <span className="block truncate text-[12px] text-white/55">{item.hint}</span>}
                        </span>
                        {item.group && <span className="hidden shrink-0 rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/50 sm:inline">{item.group}</span>}
                        {active && <CornerDownLeft className="size-4 shrink-0 text-white/50" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer hints */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/12 px-4 py-2 text-[11px] text-white/55">
              <span><kbd className="rounded border border-white/20 bg-white/10 px-1 font-mono">↑</kbd> <kbd className="rounded border border-white/20 bg-white/10 px-1 font-mono">↓</kbd> navigate</span>
              <span><kbd className="rounded border border-white/20 bg-white/10 px-1 font-mono">↵</kbd> run</span>
              <span><kbd className="rounded border border-white/20 bg-white/10 px-1 font-mono">esc</kbd> close</span>
              <span className="ml-auto inline-flex items-center gap-1"><Compass className="size-3" aria-hidden="true" /> {MOD_KEY} K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
