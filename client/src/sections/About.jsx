import Page from '../components/Page.jsx';
import { profile, stats } from '../data/profile.js';
import { box, u } from '../lib/u.js';

// Stat card positions and the number/label offsets inside each, as on the Canva page.
const STAT_BOXES = [
  { card: [824, 181, 220, 217], num: [33, 32], label: [33, 124] },
  { card: [1066, 181, 220, 217], num: [25, 49], label: [32, 140] },
  { card: [827, 413, 220, 217], num: [30, 19], label: [30, 110] },
  { card: [1066, 413, 220, 217], num: [25, 27], label: [25, 118] },
];

export default function About() {
  const desktop = (
    <>
      <div className="card" style={box(60, 156, 738, 488)} />
      <h2
        className="whitespace-nowrap text-center font-bold uppercase text-white"
        style={{ ...box(60, 187, 738), fontSize: u(29.2), lineHeight: u(33), letterSpacing: u(5.4) }}
      >
        About Me
      </h2>
      <p
        className="text-left text-white"
        style={{ ...box(92, 249, 676), fontSize: u(22.4), lineHeight: u(32), letterSpacing: u(0.4) }}
      >
        {profile.bio}
      </p>
      <ul className="flex flex-wrap" aria-label="Focus areas" style={{ ...box(92, 432, 676), gap: u(12) }}>
        {profile.focusAreas.map((area) => (
          <li key={area} className="chip" style={{ fontSize: u(17), lineHeight: u(22), padding: `${u(9)} ${u(18)}` }}>
            {area}
          </li>
        ))}
      </ul>

      <ul aria-label="Quick stats" className="contents">
        {stats.map((stat, i) => {
          const { card, num, label } = STAT_BOXES[i];
          return (
            <li key={stat.label} className="card" style={box(...card)}>
              <span
                className="block whitespace-nowrap font-black text-white"
                style={{ ...box(num[0], num[1]), fontSize: u(67.7), lineHeight: u(67) }}
              >
                {stat.value}
              </span>
              <span
                className="block whitespace-nowrap font-slab text-white"
                style={{ ...box(label[0], label[1]), fontSize: u(24.9), lineHeight: u(38), letterSpacing: u(0.85) }}
              >
                {stat.label}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );

  const mobile = (
    <>
      <div className="card px-5 py-6">
        <h2 className="text-center text-[24px] font-bold uppercase tracking-[0.18em] text-white">About Me</h2>
        <p className="mt-4 text-left text-[16px] leading-[1.5] text-white">{profile.bio}</p>
        <ul className="mt-5 flex flex-wrap gap-2.5" aria-label="Focus areas">
          {profile.focusAreas.map((area) => (
            <li key={area} className="chip px-3.5 py-1.5 text-[15px]">
              {area}
            </li>
          ))}
        </ul>
      </div>
      <ul aria-label="Quick stats" className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <li key={stat.label} className="card px-4 py-5">
            <span className="block text-[44px] font-black leading-none text-white">{stat.value}</span>
            <span className="mt-3 block font-slab text-[17px] leading-tight text-white">{stat.label}</span>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <Page id="about" label="About" mobile={mobile}>
      {desktop}
    </Page>
  );
}
