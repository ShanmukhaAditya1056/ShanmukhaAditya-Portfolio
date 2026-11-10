import { Mail, MapPin } from 'lucide-react';
import Page, { PageHeading } from '../components/Page.jsx';
import CopyButton from '../components/CopyButton.jsx';
import ContactForm from '../components/ContactForm.jsx';
import { GitHubIcon, LinkedInIcon } from '../components/BrandIcons.jsx';
import { profile } from '../data/profile.js';
import { box, u } from '../lib/u.js';

const stripProtocol = (url) => url.replace(/^https?:\/\/(www\.)?/, '');

const CHANNELS = [
  { label: 'Email', value: profile.email, href: `mailto:${profile.email}`, copy: profile.email, Icon: Mail },
  { label: 'GitHub', value: stripProtocol(profile.github), href: profile.github, copy: profile.github, Icon: GitHubIcon, external: true },
  { label: 'LinkedIn', value: stripProtocol(profile.linkedin), href: profile.linkedin, copy: profile.linkedin, Icon: LinkedInIcon, external: true },
  { label: 'Location', value: profile.location, copy: profile.location, Icon: MapPin },
];

const HEADLINE = 'Looking for an engineer who takes craft and security seriously?';

function Channels({ scaled }) {
  const iconStyle = scaled ? { width: u(20), height: u(20) } : { width: 20, height: 20 };
  return (
    <ul className="flex flex-col" style={scaled ? { gap: u(10) } : { gap: 12 }}>
      {CHANNELS.map(({ label, value, href, copy, Icon, external }) => (
        <li
          key={label}
          className="flex items-center rounded-full border border-white/25 bg-white/10"
          style={scaled ? { gap: u(14), padding: `${u(9)} ${u(10)} ${u(9)} ${u(16)}` } : { gap: 12, padding: '9px 10px 9px 14px' }}
        >
          <Icon style={iconStyle} className="shrink-0 text-cream" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-slab uppercase text-white/80" style={scaled ? { fontSize: u(11.5), lineHeight: u(15), letterSpacing: u(1.2) } : { fontSize: 11, letterSpacing: '0.1em' }}>
              {label}
            </p>
            {href ? (
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="block truncate font-medium text-white hover:text-cream"
                style={scaled ? { fontSize: u(16.5), lineHeight: u(22) } : { fontSize: 16 }}
              >
                {value}
              </a>
            ) : (
              <p className="truncate font-medium text-white" style={scaled ? { fontSize: u(16.5), lineHeight: u(22) } : { fontSize: 16 }}>
                {value}
              </p>
            )}
          </div>
          <CopyButton value={copy} label={label} scaled={scaled} />
        </li>
      ))}
    </ul>
  );
}

export default function Contact() {
  const desktop = (
    <>
      <PageHeading>Contact</PageHeading>

      <div className="card" style={{ ...box(60, 210, 560, 430), padding: u(28) }}>
        <p className="font-bold text-white" style={{ fontSize: u(24), lineHeight: u(31) }}>
          {HEADLINE} <span className="text-cream">Let&apos;s talk.</span>
        </p>
        <div style={{ marginTop: u(20) }}>
          <Channels scaled />
        </div>
      </div>

      <div className="card" style={{ ...box(646, 210, 660, 430), padding: u(28) }}>
        <ContactForm scaled />
      </div>
    </>
  );

  const mobile = (
    <>
      <h2 className="text-center text-[24px] font-bold uppercase tracking-[0.18em] text-white">Contact</h2>
      <div className="card px-5 py-6">
        <p className="text-[21px] font-bold leading-snug text-white">
          {HEADLINE} <span className="text-cream">Let&apos;s talk.</span>
        </p>
        <div className="mt-5">
          <Channels />
        </div>
      </div>
      <div className="card px-5 py-6">
        <ContactForm />
      </div>
    </>
  );

  return (
    <Page id="contact" label="Contact" mobile={mobile}>
      {desktop}
    </Page>
  );
}
