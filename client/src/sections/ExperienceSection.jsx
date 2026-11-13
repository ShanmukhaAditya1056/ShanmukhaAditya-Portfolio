import { forwardRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Briefcase, Calendar, ChevronDown, Download, Eye, GraduationCap, MapPin } from 'lucide-react';
import Page, { PageHeading } from '../components/Page.jsx';
import { certifications, education, experienceFilters, workExperience } from '../data/experienceData.js';
import { box, u } from '../lib/u.js';

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

/** Same translucent glass as the Skills / Projects / Contact cards. */
function GlassCard({ as: Tag = 'div', className = '', style, children, ...rest }) {
  return (
    <Tag className={`card ${className}`} style={style} {...rest}>
      {children}
    </Tag>
  );
}

/** Round glass icon button (same look as the project scroller arrows). */
function IconLink({ href, label, download, children, scaled }) {
  const size = scaled ? { width: u(22), height: u(22) } : { width: 32, height: 32 };
  return (
    <a
      href={href}
      target={download ? undefined : '_blank'}
      rel={download ? undefined : 'noopener noreferrer'}
      download={download || undefined}
      aria-label={label}
      title={label}
      className="grid shrink-0 place-items-center rounded-full border border-white/45 bg-white/12 text-white transition hover:border-cream hover:bg-white/22 hover:text-cream"
      style={size}
    >
      {children}
    </a>
  );
}

/** View + download for a certificate file. */
function CertificateActions({ cert, scaled }) {
  if (!cert.file) return null;
  const icon = scaled ? { width: u(12), height: u(12) } : { width: 15, height: 15 };
  return (
    <div className="flex shrink-0 items-center" style={{ gap: scaled ? u(6) : 6 }}>
      <IconLink href={cert.file} label={`View ${cert.title} certificate (opens in a new tab)`} scaled={scaled}>
        <Eye aria-hidden="true" style={icon} />
      </IconLink>
      <IconLink href={cert.file} label={`Download ${cert.title} certificate`} download={cert.downloadName || true} scaled={scaled}>
        <Download aria-hidden="true" style={icon} />
      </IconLink>
    </div>
  );
}

function FilterToggle({ value, onChange, scaled }) {
  const pad = scaled ? `${u(6)} ${u(13)}` : '7px 14px';
  const font = scaled ? { fontSize: u(12.5), lineHeight: u(17) } : { fontSize: 13, lineHeight: '18px' };
  return (
    <div role="group" aria-label="Filter experience" className={`pillnav inline-flex items-center justify-center ${scaled ? "flex-nowrap" : "flex-wrap"}`} style={{ padding: scaled ? u(4) : 4, gap: scaled ? u(4) : 4 }}>
      {experienceFilters.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(f.id)}
            className={`rounded-full font-semibold whitespace-nowrap transition-colors duration-300 ${active ? 'bg-linen text-ink-text' : 'text-white/80 hover:text-white'}`}
            style={{ ...font, padding: pad }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: 'easeOut' },
};

/* ------------------------------------------------------------------ */
/* Work experience timeline                                            */
/* ------------------------------------------------------------------ */

function TimelineItem({ job, scaled, last }) {
  const s = (n) => (scaled ? u(n) : `${n}px`);
  return (
    <li className="relative" style={{ paddingLeft: s(34), paddingBottom: last ? 0 : s(14) }}>
      {/* glowing accent line + node */}
      {!last && (
        <span
          aria-hidden="true"
          className="absolute bg-linear-to-b from-linen/80 via-linen/35 to-linen/10"
          style={{ left: s(9), top: s(18), bottom: 0, width: s(2), boxShadow: '0 0 10px rgba(243,239,234,0.35)' }}
        />
      )}
      <span aria-hidden="true" className="absolute grid place-items-center" style={{ left: 0, top: s(2), width: s(20), height: s(20) }}>
        <span className="absolute inset-0 rounded-full bg-linen/40 motion-safe:animate-ping" style={{ animationDuration: '2.2s' }} />
        <span className="relative rounded-full border-2 border-linen bg-navy" style={{ width: s(12), height: s(12), boxShadow: '0 0 12px rgba(243,239,234,0.75)' }} />
      </span>

      <div className="flex flex-wrap items-start justify-between" style={{ gap: s(8) }}>
        <div className="min-w-0">
          <h4 className="font-bold text-white" style={{ fontSize: s(16.5), lineHeight: s(22) }}>
            {job.role}
          </h4>
          <p className="flex flex-wrap items-center text-white/85" style={{ fontSize: s(13.5), lineHeight: s(19), gap: s(10), marginTop: s(2) }}>
            <span className="inline-flex items-center font-semibold text-linen" style={{ gap: s(5) }}>
              <Briefcase aria-hidden="true" style={{ width: s(13), height: s(13) }} />
              {job.company}
            </span>
            <span className="inline-flex items-center" style={{ gap: s(5) }}>
              <MapPin aria-hidden="true" style={{ width: s(13), height: s(13) }} />
              {job.location}
            </span>
          </p>
        </div>
        <span className="chip inline-flex shrink-0 items-center font-semibold" style={{ fontSize: s(12), lineHeight: s(16), padding: `${s(4)} ${s(10)}`, gap: s(5) }}>
          <Calendar aria-hidden="true" style={{ width: s(12), height: s(12) }} />
          <time>{job.start}</time> – <time>{job.end}</time>
        </span>
      </div>

      <ul className="list-disc text-white/90" aria-label={`${job.role} achievements`} style={{ fontSize: s(12.8), lineHeight: s(17.5), marginTop: s(6), paddingLeft: s(18) }}>
        {job.highlights.map((h) => (
          <li key={h} style={{ marginTop: s(2) }}>
            {h}
          </li>
        ))}
      </ul>

      <ul className="flex flex-wrap" aria-label={`${job.role} tech stack`} style={{ gap: s(6), marginTop: s(7) }}>
        {job.stack.map((t) => (
          <li key={t} className="chip" style={{ fontSize: s(11.5), lineHeight: s(15), padding: `${s(3)} ${s(9)}` }}>
            {t}
          </li>
        ))}
      </ul>
    </li>
  );
}

// forwardRef: AnimatePresence mode="popLayout" passes a ref to measure the column while it exits.
const WorkColumn = forwardRef(function WorkColumn({ scaled, style }, ref) {
  const s = (n) => (scaled ? u(n) : `${n}px`);
  return (
    <motion.section ref={ref} layout aria-labelledby="experience-work" {...fade} className={scaled ? 'absolute' : ''} style={style}>
      <GlassCard className="h-full" style={{ borderRadius: s(22) }}>
        <div className="flex h-full flex-col" style={{ padding: `${s(16)} ${s(24)}` }}>
          <h3 id="experience-work" className="inline-flex items-center font-bold uppercase text-white" style={{ fontSize: s(14), lineHeight: s(18), letterSpacing: s(2.5), gap: s(8) }}>
            <Briefcase aria-hidden="true" className="text-linen" style={{ width: s(16), height: s(16) }} />
            Work Experience
          </h3>
          <ol className="min-h-0 flex-1 overflow-y-auto" aria-label="Work experience timeline" style={{ marginTop: s(12), paddingRight: s(4) }}>
            {workExperience.map((job, i) => (
              <TimelineItem key={job.id} job={job} scaled={scaled} last={i === workExperience.length - 1} />
            ))}
          </ol>
        </div>
      </GlassCard>
    </motion.section>
  );
});

/* ------------------------------------------------------------------ */
/* Education + certifications                                          */
/* ------------------------------------------------------------------ */

function EducationCard({ item, scaled }) {
  const s = (n) => (scaled ? u(n) : `${n}px`);
  return (
    <article className="rounded-xl border border-white/15 bg-white/5" style={{ padding: `${s(10)} ${s(12)}`, borderRadius: s(14) }} aria-labelledby={`edu-${item.id}`}>
      <div className="flex items-start" style={{ gap: s(10) }}>
        <span className="grid shrink-0 place-items-center rounded-full bg-linen/15 text-linen" style={{ width: s(32), height: s(32) }}>
          <GraduationCap aria-hidden="true" style={{ width: s(17), height: s(17) }} />
        </span>
        <div className="min-w-0">
          <h4 id={`edu-${item.id}`} className="font-bold text-white" style={{ fontSize: s(14.5), lineHeight: s(19) }}>
            {item.degree}
          </h4>
          <p className="text-linen" style={{ fontSize: s(12), lineHeight: s(16), marginTop: s(1) }}>
            {item.specialization}
          </p>
          <p className="text-white/85" style={{ fontSize: s(12), lineHeight: s(16), marginTop: s(2) }}>
            {item.institution}
          </p>
          <p className="inline-flex items-center text-white/75" style={{ fontSize: s(11.5), lineHeight: s(15), marginTop: s(2), gap: s(5) }}>
            <Calendar aria-hidden="true" style={{ width: s(12), height: s(12) }} />
            {item.timeline}
          </p>
        </div>
      </div>
      <ul className="flex flex-wrap" aria-label="Focus areas" style={{ gap: s(6), marginTop: s(7) }}>
        {item.focusAreas.map((f) => (
          <li key={f} className="chip" style={{ fontSize: s(11.5), lineHeight: s(15), padding: `${s(3)} ${s(9)}` }}>
            {f}
          </li>
        ))}
      </ul>
    </article>
  );
}

function CertificationCard({ cert, scaled }) {
  const s = (n) => (scaled ? u(n) : `${n}px`);
  const [open, setOpen] = useState(false);
  const panelId = `cert-${cert.id}-competencies`;
  return (
    <article className="rounded-xl border border-white/15 bg-white/5" style={{ padding: `${s(6)} ${s(12)}`, borderRadius: s(14) }} aria-labelledby={`cert-${cert.id}`}>
      <div className="flex items-start" style={{ gap: s(10) }}>
        <span className="grid shrink-0 place-items-center rounded-full bg-linen/15 text-linen" style={{ width: s(30), height: s(30) }}>
          <Award aria-hidden="true" style={{ width: s(16), height: s(16) }} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 id={`cert-${cert.id}`} className="font-bold text-white" style={{ fontSize: s(13.5), lineHeight: s(18) }}>
            {cert.title}
          </h4>
          <p className="text-white/85" style={{ fontSize: s(11.6), lineHeight: s(15.5), marginTop: s(1) }}>
            {cert.summary}
          </p>
          <div className="flex items-center justify-between" style={{ gap: s(8), marginTop: s(3) }}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center font-semibold text-linen transition hover:text-white"
              style={{ fontSize: s(11.5), lineHeight: s(16), gap: s(4) }}
            >
              Key competencies
              <ChevronDown aria-hidden="true" className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} style={{ width: s(13), height: s(13) }} />
            </button>
            <CertificateActions cert={cert} scaled={scaled} />
          </div>
          <AnimatePresence initial={false}>
            {open && (
              <motion.ul
                id={panelId}
                key="tags"
                className="flex flex-wrap overflow-hidden"
                aria-label={`${cert.title} key competencies`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ gap: s(6) }}
              >
                {cert.competencies.map((c) => (
                  <li key={c} className="chip" style={{ fontSize: s(11.5), lineHeight: s(15), padding: `${s(3)} ${s(9)}`, marginTop: s(6) }}>
                    {c}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}

// forwardRef: AnimatePresence mode="popLayout" passes a ref to measure the column while it exits.
const CredentialsColumn = forwardRef(function CredentialsColumn({ scaled, style }, ref) {
  const s = (n) => (scaled ? u(n) : `${n}px`);
  return (
    <motion.section ref={ref} layout aria-labelledby="experience-credentials" {...fade} className={scaled ? 'absolute' : ''} style={style}>
      <GlassCard className="h-full" style={{ borderRadius: s(22) }}>
        <div className="flex h-full flex-col" style={{ padding: `${s(16)} ${s(24)}` }}>
          <h3 id="experience-credentials" className="inline-flex items-center font-bold uppercase text-white" style={{ fontSize: s(14), lineHeight: s(18), letterSpacing: s(2.5), gap: s(8) }}>
            <GraduationCap aria-hidden="true" className="text-linen" style={{ width: s(16), height: s(16) }} />
            Education & Certifications
          </h3>
          <div className="min-h-0 flex-1 overflow-y-auto" style={{ marginTop: s(12), paddingRight: s(4) }}>
            <div className="flex flex-col" style={{ gap: s(6) }}>
              {education.map((item) => (
                <EducationCard key={item.id} item={item} scaled={scaled} />
              ))}
              {certifications.map((cert) => (
                <CertificationCard key={cert.id} cert={cert} scaled={scaled} />
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.section>
  );
});

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const TOP = 210;
const H = 526;
// A lone column sizes to its content instead of keeping the two-column height.
const FULL = box(60, TOP, 1246);

export default function ExperienceSection() {
  const [filter, setFilter] = useState('all');
  const showWork = filter !== 'credentials';
  const showCreds = filter !== 'work';

  const desktop = (
    <>
      <PageHeading id="experience-title">Experience</PageHeading>
      <div className="flex items-center justify-end" style={box(760, 146, 546, 44)}>
        <FilterToggle value={filter} onChange={setFilter} scaled />
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        {showWork && <WorkColumn key="work" scaled style={showCreds ? box(60, TOP, 700, H) : FULL} />}
        {showCreds && <CredentialsColumn key="creds" scaled style={showWork ? box(784, TOP, 522, H) : FULL} />}
      </AnimatePresence>
    </>
  );

  const mobile = (
    <>
      <h2 id="experience-title-m" className="text-center text-[24px] font-bold uppercase tracking-[0.18em] text-white">
        Experience
      </h2>
      <div className="flex justify-center">
        <FilterToggle value={filter} onChange={setFilter} />
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        {showWork && <WorkColumn key="work" />}
        {showCreds && <CredentialsColumn key="creds" />}
      </AnimatePresence>
    </>
  );

  return (
    <Page id="experience" label="Experience & Credentials" mobile={mobile}>
      {desktop}
    </Page>
  );
}
