import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Page, { PageHeading } from '../components/Page.jsx';
import { GitHubIcon } from '../components/BrandIcons.jsx';
import { profile } from '../data/profile.js';
import useProjects from '../hooks/useProjects.js';
import { box, u } from '../lib/u.js';

/** GitHub link for a card: its own repoUrl, or <your GitHub>/<project id>. */
const repoLink = (project) => project.repoUrl || `${profile.github}/${project.id}`;

function useScroller() {
  const ref = useRef(null);
  const scrollByCard = (dir) => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 0) : el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };
  return { ref, scrollByCard };
}

function Links({ project, scaled }) {
  const iconStyle = scaled ? { width: u(16), height: u(16) } : { width: 16, height: 16 };
  const pill = scaled ? { fontSize: u(15), lineHeight: u(20), padding: `${u(9)} ${u(18)}` } : { fontSize: 14, padding: '9px 16px' };
  return (
    <div className="flex flex-wrap items-center" style={scaled ? { gap: u(12) } : { gap: 10 }}>
      <a href={repoLink(project)} target="_blank" rel="noopener noreferrer" className="btn-cyan rounded-full" style={pill}>
        <GitHubIcon style={iconStyle} />
        GitHub
        <span className="sr-only"> repository for {project.title} (opens in a new tab)</span>
      </a>
      {/* Only rendered when a deployment exists — no dead "Live Demo" pills */}
      {project.demoUrl && (
        <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn-glass rounded-full" style={pill}>
          <ExternalLink style={iconStyle} aria-hidden="true" />
          Live Demo
          <span className="sr-only"> of {project.title} (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}

function ArrowButton({ dir, onClick, scaled }) {
  const Icon = dir < 0 ? ChevronLeft : ChevronRight;
  const size = scaled ? { width: u(44), height: u(44) } : { width: 40, height: 40 };
  const icon = scaled ? { width: u(24), height: u(24) } : { width: 22, height: 22 };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? 'Previous projects' : 'Next projects'}
      className="grid place-items-center rounded-full border border-white/45 bg-white/12 text-white transition hover:border-cream hover:bg-white/22 hover:text-cream"
      style={size}
    >
      <Icon style={icon} aria-hidden="true" />
    </button>
  );
}

export default function Projects() {
  const projects = useProjects();
  const { ref, scrollByCard } = useScroller();

  const desktop = (
    <>
      <PageHeading id="projects-title">Projects</PageHeading>

      <div className="flex items-center" style={{ ...box(1174, 146, 104, 44), gap: u(16) }}>
        <ArrowButton dir={-1} onClick={() => scrollByCard(-1)} scaled />
        <ArrowButton dir={1} onClick={() => scrollByCard(1)} scaled />
      </div>

      <ul
        ref={ref}
        aria-labelledby="projects-title"
        className="hscroll"
        style={{ ...box(60, 210, 1246, 356), columnGap: u(26), paddingBottom: u(14) }}
      >
        {projects.map((project) => (
          <li key={project.id} className="card flex shrink-0 flex-col" style={{ width: u(560), height: u(340), padding: `${u(26)} ${u(30)}` }}>
            <h3 className="font-bold text-white" style={{ fontSize: u(25), lineHeight: u(31) }}>
              {project.title}
            </h3>
            <p className="text-white" style={{ fontSize: u(16.5), lineHeight: u(24), marginTop: u(12) }}>
              {project.outcome}
            </p>
            <ul className="flex flex-wrap" aria-label={`${project.title} tech stack`} style={{ gap: u(8), marginTop: u(16) }}>
              {project.stack.map((tech) => (
                <li key={tech} className="chip" style={{ fontSize: u(13), lineHeight: u(18), padding: `${u(4)} ${u(12)}` }}>
                  {tech}
                </li>
              ))}
            </ul>
            <div className="mt-auto" style={{ paddingTop: u(16) }}>
              <Links project={project} scaled />
            </div>
          </li>
        ))}
      </ul>
    </>
  );

  const mobile = (
    <>
      <div className="flex items-center justify-between">
        <h2 id="projects-title-m" className="text-[24px] font-bold uppercase tracking-[0.18em] text-white">
          Projects
        </h2>
        <div className="flex gap-2.5">
          <ArrowButton dir={-1} onClick={() => scrollByCard(-1)} />
          <ArrowButton dir={1} onClick={() => scrollByCard(1)} />
        </div>
      </div>
      <ul ref={ref} aria-labelledby="projects-title-m" className="hscroll -mx-4 px-4 pb-3" style={{ columnGap: 14 }}>
        {projects.map((project) => (
          <li key={project.id} className="card flex w-[82vw] max-w-[360px] shrink-0 flex-col px-5 py-6">
            <h3 className="text-[20px] font-bold leading-snug text-white">{project.title}</h3>
            <p className="mt-2.5 text-[15px] leading-[1.45] text-white">{project.outcome}</p>
            <ul className="mt-3.5 flex flex-wrap gap-2" aria-label={`${project.title} tech stack`}>
              {project.stack.map((tech) => (
                <li key={tech} className="chip px-3 py-1 text-[12.5px]">
                  {tech}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-5">
              <Links project={project} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <Page id="projects" label="Projects" mobile={mobile}>
      {desktop}
    </Page>
  );
}
