# CEDA Innovation Portal

Our entry for the CEDA Innovation Management Portal Hackathon 2026: one place where CEDA takes in submissions, evaluates them, talks to innovators securely, and tracks all of it.

## Links

| What | Where |
| --- | --- |
| Live portal | https://letsema--neon-bw-3x0x.us-east4.hosted.app (judges start at `/judges`) |
| Walkthrough video (unlisted, about 9 minutes) | https://youtu.be/FZXYH_fw_eQ |
| Source code | https://github.com/luxraye/letsema |

Built by Local Grow Pty Ltd during the hackathon window. The live portal scales to zero when idle, so the first visit after a quiet spell can take a few seconds.

## CEDA's four jobs, and where each happens

| CEDA asked for | Where it lives |
| --- | --- |
| Take submissions into a single repository | `/instances` → apply. Autosaving 4-step form, checked uploads, a sealed receipt with a fingerprint on submit, versions with a word-level diff on resubmission. |
| Have evaluators evaluate there | Screening (`/dashboard/screening`), blind scoring with conflict declarations (`/dashboard/review`), calibrated ranking and a panel vote (`/dashboard/panel`). |
| Communicate with innovators securely | A message thread per application with staff-only notes, live chat with working hours, support tickets with deadlines, free email/SMS alerts. |
| Track all of it | Status timeline per application, public tracker by reference, and a hash-chained audit trail anyone can verify at `/api/audit/verify`. |

CEDA did not supply a process flow, so we designed one: **Instances**. An Instance is a competition defined by its rules (eligibility, stages, form, rubric, reviewers per entry, prizes). Admins build them in Instance Studio with no code, and partners such as BDIH and BTC run their own in their own spaces. See `/how-it-works`.

Judges: `/judges` maps every scoring criterion to the screen that shows it, with one-click sign-in as the right role.

## Demo accounts

Every account uses the password `CedaDemo2026!`. The sign-in page also has one-click buttons.

| Role | Email |
| --- | --- |
| Innovator | innovator@demo.ceda.bw |
| Evaluator | evaluator@demo.ceda.bw |
| Adjudication panel | panel@demo.ceda.bw |
| Committee observer | observer@demo.ceda.bw |
| CEDA consultant | consultant@demo.ceda.bw |
| CEDA administrator | admin@demo.ceda.bw |
| Partner admin (BDIH) | partner@demo.ceda.bw |
| Super administrator | super@demo.ceda.bw |
| CEDA staff innovator | staff@demo.ceda.bw |

Demo emails and SMS are not sent; they appear at `/demo-inbox`. All people, companies and applications in the demo data are fictional.

## Run it

Needs Node.js 22 and PostgreSQL 16.

```bash
cp .env.example .env          # set DATABASE_URL and SESSION_SECRET
npm install
npm run db:push               # create tables
npm run db:seed               # demo data (wipes the database)
npm run dev                   # http://localhost:3000
```

Production: `npm run build && npm run start`. The build is a standalone Node server, so it runs in one container on any cloud or on servers in Botswana. Health check: `/api/health`.

## Tests

```bash
npm run typecheck
npm test                      # unit tests: scoring, calibration, integrity, working hours, roles
npm run test:e2e              # browser tests: every page for every role, and the main flows
```

GitHub Actions runs all of them on every push, against a fresh PostgreSQL and a production build.

## How it is built

- Next.js 16 (App Router, server actions), React 19, TypeScript, Tailwind CSS v4.
- PostgreSQL via Drizzle ORM. Files are stored in the database, not on public links.
- Server-side sessions (random tokens stored as SHA-256), bcrypt passwords with lockout, one-time codes, passkeys (WebAuthn) for fingerprint and face sign-in.
- Role-based access with eight roles; admins run the process but cannot score or vote.
- Audit trail: each record carries the hash of the one before, appended under a database lock.
- Partner API at `/api/v1` with keys stored only as fingerprints and scoped to a space.

## Honest notes

- All code in this repository was written from 19 November 2026 onwards, and the commit history shows each step. An earlier prototype of ours, in another repository, served as a reference for features and, from 19 November, for the visual design. The look (colour tokens, sunrise logo shape, header, cards, dashboard) was matched to it by rewriting the components here, not by copying its files.
- Photos are from Unsplash under the Unsplash licence; credits are in `public/photos/CREDITS.md` and on `/status`.
- The privacy notice and regulator list are prototypes for CEDA's own teams to confirm.
