# Neural Flow — Build Summary

A landing page and Express API for **Neural Flow**, a fictional AI startup,
built by a three-person agent team (frontend-dev, backend-dev, qa — all on
Sonnet) coordinated by a lead session. Built 2026-09-26.

## How to run

```bash
npm install
npm start          # node src/server.js
```

Open <http://localhost:3000>. Set `PORT` to use a different port.

## What was built

| File | Owner | Purpose |
| :-- | :-- | :-- |
| `src/index.html` | frontend-dev | Hero, 3-feature grid, 3-tier pricing table, contact form |
| `src/styles.css` | frontend-dev | Dark theme, responsive layout, load-in animation |
| `src/app.js` | frontend-dev | Fetches features/pricing, submits the contact form |
| `src/server.js` | backend-dev | Express server: static pages + JSON API |
| `package.json`, `README.md` | backend-dev | Dependencies (Express 5), start script, API docs |
| `tests/test-plan.md`, `tests/report.md` | qa | Test plan and pass/fail report |

### API

| Method | Path | Response |
| :-- | :-- | :-- |
| GET | `/api/features` | 3 × `{ id, title, description, icon }` |
| GET | `/api/pricing` | 3 × `{ id, name, price, period, features[], highlighted }` — Starter $0, Pro $49 (highlighted), Enterprise $499 |
| POST | `/api/contact` | Body `{ name, email, message }` → `200 { ok: true, message }` or `400 { ok: false, error }`; valid submissions are logged |
| * | `/api/*` (unknown) | `404 { ok: false, error: "Not found" }` |

## Key decisions and why

**The API contract was fixed up front by the lead.** Both devs received the
same field names in their spawn prompts, so frontend and backend could be
built in parallel without waiting on each other. QA's first pass found zero
contract mismatches.

**Strict file ownership per teammate.** Each agent owned a disjoint set of
files (see table above), which is the main failure mode the team guide warns
about — no two agents ever edited the same file.

**Frontend renders from the API but ships static fallback content.** Cards
are pre-rendered in the HTML and replaced with live data once the fetch
succeeds (`data-state="fallback"` → `"live"`), so the page never looks empty
or broken if the API is down.

**Design built around the hero's neural-network diagram.** The 2-3-2 node
graph defines the palette: violet / amber / teal on a near-black base, reused
for feature-card accents and pricing highlights. One orchestrated load
animation (the network "firing" left to right) instead of scattered hover
effects; `prefers-reduced-motion` disables it.

**Static serving is an allow-list, not a directory.** Serving `src/` with
`express.static` exposed `server.js` source code (QA BUG-1). The server now
serves exactly `/`, `/index.html`, `/styles.css`, `/app.js`; anything else is
a 404. Trade-off: new frontend assets must be added to `STATIC_FILES` in
`src/server.js`.

**Defensive contact endpoint.** Email regex plus length caps (name 100,
email 254, message 5000), JSON error responses for malformed or oversized
bodies with no stack traces, and submissions logged via `JSON.stringify` so
user input can't forge log lines. `X-Powered-By` is disabled.

## Quality results

| Pass | Checks | Pass | Fail |
| :-- | --: | --: | --: |
| First review | 64 | 58 | 6 |
| Re-check after fixes | 68 | 68 | 0 |
| After CTA change | 70 | 70 | 0 |

The 6 first-pass failures (1 medium, 5 low/trivial) were: source-code
exposure via static serving, weak email validation, HTML stack traces on bad
JSON, log-line injection, below-AA text contrast, and an unstyled CTA class.
All were fixed by their owners and re-verified by QA. Details:
`tests/report.md`.

The lead additionally verified the running server with curl and rendered the
page in headless Chrome at desktop (1440px) and phone (390px) widths.

## Process notes

- Split-pane teammate launches failed repeatedly early on (tmux
  `fork failed: Device not configured`) for frontend-dev and backend-dev, so
  the initial build ran them as background workers with the lead relaying
  messages to qa. The fix round succeeded as real split-pane teammates.
- One frontend worker was stopped mid-task and replaced; the replacement
  picked up the existing `index.html`/`app.js` and wrote `styles.css`.

## Known limitations

- Contact submissions are only logged to the console — no storage or email.
- All pricing buttons say "Get started" and jump to the contact form; the form does not record which plan was chosen.
- Features and pricing data are hard-coded in `src/server.js`.
