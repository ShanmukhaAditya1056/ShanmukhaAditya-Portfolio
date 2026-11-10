# Shanmukha Aditya – Portfolio

A full-stack MERN developer portfolio that reproduces the Canva design
(https://hedgehog-8k0gvy.my.canva.site/) as a real website: React (Vite + Tailwind CSS v4)
on the front end, Express + MongoDB on the back end.

```
myportfolio/
├── client/                 React app (Vite)
│   ├── public/             bg-flowers.png, portrait.png, signature.png, favicon.svg
│   └── src/
│       ├── components/     Navbar (frosted pill), PortfolioFloralBackground (Framer Motion petals), Page, ContactForm, CopyButton
│       ├── sections/       Hero, About, Skills, Projects, Contact
│       ├── hooks/          useScrollSpy, useTypeSequence, useProjects
│       ├── lib/u.js        design-unit helpers (1366×768 canvas → viewport)
│       ├── data/profile.js ← your name, links, bio, stats, skills
│       └── index.css       theme tokens, page/canvas layout, card/chip/input styles
├── server/                 Express API
│   ├── server.js
│   ├── models/ContactMessage.js
│   ├── routes/contact.js   POST /api/contact
│   └── routes/projects.js  GET  /api/projects
└── shared/projects.json    ← project cards (used by both API and client)
```

## How the layout works

The Canva design is a 1366×768 canvas. On screens 900px and wider, each page is a
viewport-filling section with an absolutely positioned canvas layer; every element uses the
coordinates measured on the live Canva site, in "design units" (`--u` = one canvas pixel,
set in `index.css`). This keeps the pages pixel-proportional at any desktop width.
Below 900px the same content switches to a stacked mobile layout.

Fonts (Google Fonts): Montserrat (headings, nav, body), Open Sans Bold ("Portfolio" logo),
Roboto Slab (stat labels, form labels).

## Quick start

```bash
npm install                          # installs client + server (npm workspaces)
cp server/.env.example server/.env   # then set MONGO_URI
npm run dev                          # API on :5000, site on http://localhost:5173
```

You need MongoDB for the contact form. Use a local `mongod` or a free MongoDB Atlas cluster.
If `MONGO_URI` is missing or unreachable the site still runs, but `POST /api/contact`
returns **503** and the form shows a "please email me directly" toast.

## Production

```bash
npm run build      # builds client/dist
npm start          # Express serves the API and the built site on $PORT
```

Deploy as a single Node service (Render, Railway, Fly.io, a VPS). Set `NODE_ENV=production`,
`MONGO_URI` and `PORT`.

### Render

`render.yaml` is a Blueprint: **New → Blueprint → this repo** creates the service with the right
settings. If you created the service by hand instead, make sure these match (Settings tab):

| Setting | Value |
|---|---|
| Root Directory | *(empty — the repo root, not `server/`)* |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

`node server.js` as the start command fails with `Cannot find module /opt/render/project/src/server.js`
because the server lives in `server/`; `npm start` runs it through the workspace. Node is pinned to 24
via `.node-version`. Add the secrets (`MONGO_URI`, `BREVO_API_KEY`, `CONTACT_TO`,
`EMAIL_VERIFICATION_API_KEY`) under Environment; `PORT` is provided by Render.

**Email on Render:** free web services block outbound SMTP (ports 25/465/587), so Gmail SMTP times out
there and the contact form returns 500. Set `MAIL_PROVIDER=brevo` + `BREVO_API_KEY` (free, 300 emails/day,
HTTPS) and verify your Gmail address as a sender in Brevo; `CONTACT_FROM` must use that verified address.
SMTP keeps working locally and on paid instances. If mail fails but MongoDB is up, the message is still
stored and the visitor gets a success response; the failure is logged as `[mail] owner notification failed`.

If you host the client separately (Vercel, Netlify):
- set `VITE_API_URL=https://your-api.example.com` when building the client
- set `CLIENT_ORIGIN=https://your-site.example.com` on the server so CORS allows it

## Personalise

| What | Where |
|---|---|
| Email, GitHub, LinkedIn, location, bio, stats, roles | `client/src/data/profile.js` |
| Portrait | `client/public/portrait.png` (transparent cutout, ~4:5) |
| Background photo | `client/public/bg-flowers.png` (the colour-graded version from the Canva site) |
| Signature | `client/public/signature.png` |
| Resume (hero "Resume" view/download button) | `client/public/resume.pdf` — the download name is `resumeFileName` in `profile.js` |
| Floating petal artwork | `client/public/assets/petal.png` (one transparent PNG; count/size/speed live in `PortfolioFloralBackground.jsx`) |
| Project cards, Live Demo / GitHub links | `shared/projects.json` (`demoUrl`, `repoUrl`; empty = greyed-out "coming soon") |
| Colours, card/chip styling | `client/src/index.css` (`@theme` block) |
| Element positions on the desktop canvas | the `box(x, y, w, h)` calls in each section (canvas units) |

## API

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/contact` | `{ name, email, subject, message, company_website? }`. 201 when delivered; 400 `{ error, errors: { field } }` on invalid input or an unverifiable email; 403 from an unlisted browser origin; 413 over 10 KB; 429 after 3 requests / 15 min per IP; 503 when neither SMTP nor MongoDB is configured. |
| `GET` | `/api/projects` | Returns the contents of `shared/projects.json`. |
| `GET` | `/api/health` | Status and DB connection state. |

## Contact form security

Defence in depth across both layers; the glass UI is unchanged.

**Client** (`client/src/components/ContactForm.jsx`)
- Off-screen honeypot `company_website` (tabIndex −1, `aria-hidden`); a filled honeypot fakes success and never hits the API.
- Time-to-submit guard: submissions under 2.5 s after mount are rejected with a gentle prompt to retry.
- Validation mirrors the server: name 2–80 (no HTML), email strict syntax ≤ 100 and no CR/LF, subject 3–120 single-line, message 10–2000.
- Typo hints for common domains ("Did you mean @gmail.com?") in `client/src/lib/emailTypos.js`.
- Button locks while sending; a 30 s cooldown is kept in `localStorage`.
- The contact email is stored in parts (`profile.emailParts`) and joined at runtime (`client/src/lib/contactEmail.js`), so the full address never appears in the page source or JS bundle.

**Server** (`server/routes/contact.js`)
- `express-rate-limit`: 3 requests / 15 min per IP → 429.
- Strict CORS allowlist (`http://localhost:5173`, `https://shanmukhaaditya-portfolio.vercel.app`, the server's own origin, plus `CLIENT_ORIGIN` extras); other browser origins get 403. 10 KB JSON body limit, Helmet headers.
- `zod` re-validation (`server/utils/contactSchema.js`) with sanitisation (`server/utils/sanitize.js`): CR/LF stripped from name/email/subject (SMTP header injection), tags stripped from the message, entities escaped in the HTML email.
- Email verification pipeline (`server/utils/emailVerification.js`): disposable-domain blocklist (`disposable-email-domains` + extras) → DNS MX / A lookup → `verifyMailboxExists()` via AbstractAPI Email Reputation (`abstract`, default), AbstractAPI legacy Email Validation (`abstract-validation`), Hunter or ZeroBounce (`EMAIL_VERIFICATION_PROVIDER` + `EMAIL_VERIFICATION_API_KEY`, 3 s timeout). A rejected key or exhausted quota is logged once as a `[verify]` warning and the check degrades gracefully. A definite "undeliverable" returns 400 with the error on the email field; unknown/timeout falls back to the DNS + blocklist result.
- Delivery (`server/utils/mailer.js`; SMTP via Nodemailer, or HTTPS via Brevo / Resend with `MAIL_PROVIDER`): notification to `CONTACT_TO` with `Reply-To` set to the visitor, plus a plain-text auto-acknowledgement to the visitor (bounce trap — a non-existent mailbox that slipped through bounces back to you). `SMTP_HOST=console` prints the messages instead of sending, for local testing.
- Messages are also stored in MongoDB when `MONGO_URI` is set (best-effort once mail has gone out).

See `server/.env.example` for every variable.
