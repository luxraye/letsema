# Letsema

**Letsema** (Setswana: working together on a shared field) is an innovation management portal prototype for the CEDA Innovation Portal Hackathon 2026. It takes an idea from submission to a funded, milestone-tracked project.

**Open preview (no sign-in needed):** https://luxraye.github.io/letsema/

## Try it in two minutes

1. Open the preview and click **Judges** in the footer. Each judging criterion links to the exact screen, signed in as the right role.
2. You can also use the **Demo** button (top bar) to switch roles at any time.
3. Codes for email/phone checks and one-time sign-in show up in the **Demo inbox**, so you don't need a real email or phone.
4. Open the site in two tabs with different roles. Scores, decisions, notifications and chat messages show up in the other tab straight away.

| Role | Person | What they do |
|---|---|---|
| Innovator | Kagiso Molefe | Submit, track, reply to feedback, resubmit |
| Reviewer | Dr Lesego Ntsima | Declare conflicts, score blind |
| Committee chair | Onalenna Dube | Compare calibrated scores, vote, decide, award |
| Committee observer | Masego Phiri | Read-only stakeholder view |
| CEDA consultant | Thato Keabetswe | Live chat console and chat analytics |
| Administrator | Neo Mothibi | Calls, form builder, content, users and roles, look, audit, privacy |
| CEDA staff innovator | Ame Lebotse | Staff-only intrapreneurship campaigns |

Every account can also sign in by password at `/login` with `Letsema2026!` (for example `innovator@letsema.demo`). **Reset demo** (double-click) in the Demo menu restores the seed data.

## The lifecycle

The six stages are Submission, Review, Feedback, Approval, Award and Develop.

- **Submission:** call-specific forms built by admins, required-field checks, autosaved drafts that also work offline, a similar-idea check while you type, and a verifiable receipt.
- **Review:** screening, auto-assignment with conflict declarations, blind scoring against weighted criteria per call, and reviewer calibration (z-scores) that removes harsh or lenient marker bias. Disagreement flags push contested ideas to discussion.
- **Feedback:** a threaded conversation on every idea. The idea can be returned for revision, and resubmission shows a word-level version diff.
- **Approval:** committee votes with a quorum, and the chair finalises the decision.
- **Award:** an award code anyone can verify at `/verify`.
- **Develop:** milestone-linked funding tranches. Evidence is submitted, verified, and the money is released.

## Architecture

- React 19 + TypeScript + Vite, Tailwind v4, react-router (hash routes so it runs on any static host).
- `src/core` holds the domain logic and does not depend on the UI. It covers workflow, RBAC, scoring and calibration, similarity, chat hours (Botswana 2026 public holidays) and the audit chain.
- Every change goes through `src/core/actions.ts`. Each action checks the permission, validates its input, writes a SHA-256 hash-chained audit entry, and sends notifications (in-app plus email/SMS to the demo outbox).
- **Preview mode:** the preview has no server. State lives in the browser (`localStorage`), and tabs stay in sync over `BroadcastChannel`. This keeps the preview open and free for judges. The production plan swaps the store for an API with PostgreSQL, keeping the same action layer. See `/status` in the app for the hosting plan and its cost estimate.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (Vitest)
npx playwright test  # end-to-end tests, desktop and phone
npm run build
```

Every push to `main` runs the unit tests, then builds and publishes to GitHub Pages (`.github/workflows/pages.yml`).

## Honest limits of this prototype

- The preview has no real backend: data is per browser, and "emails" and "SMS" go to the demo inbox.
- Passkeys use the real WebAuthn browser API, but they are checked only in the browser, not by a server.
- The hosting and cost figures are a plan with estimates, not a running deployment.
