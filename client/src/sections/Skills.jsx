import Page, { PageHeading } from '../components/Page.jsx';
import { skillGroups } from '../data/profile.js';
import { box, u } from '../lib/u.js';

const CARD_W = 398;
const CARD_X = [60, 484, 908];

export default function Skills() {
  const desktop = (
    <>
      <PageHeading>Skills</PageHeading>

      {skillGroups.map((group, i) => (
        <article key={group.title} className="card" style={{ ...box(CARD_X[i], 210, CARD_W, 430), padding: u(30) }}>
          <h3 className="font-bold text-white" style={{ fontSize: u(25), lineHeight: u(32), letterSpacing: u(1.5) }}>
            {group.title}
          </h3>
          <p className="text-white/75" style={{ fontSize: u(15.5), lineHeight: u(22), marginTop: u(6) }}>
            {group.blurb}
          </p>
          <ul className="flex flex-wrap" style={{ gap: u(11), marginTop: u(22) }}>
            {group.skills.map((skill) => (
              <li key={skill} className="chip" style={{ fontSize: u(17), lineHeight: u(22), padding: `${u(8)} ${u(16)}` }}>
                {skill}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </>
  );

  const mobile = (
    <>
      <h2 className="text-center text-[24px] font-bold uppercase tracking-[0.18em] text-white">Skills</h2>
      {skillGroups.map((group) => (
        <article key={group.title} className="card px-5 py-6">
          <h3 className="text-[20px] font-bold tracking-wide text-white">{group.title}</h3>
          <p className="mt-1 text-[14px] leading-snug text-white/75">{group.blurb}</p>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {group.skills.map((skill) => (
              <li key={skill} className="chip px-3.5 py-1.5 text-[15px]">
                {skill}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </>
  );

  return (
    <Page id="skills" label="Skills" mobile={mobile}>
      {desktop}
    </Page>
  );
}
