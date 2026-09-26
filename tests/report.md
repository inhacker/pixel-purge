# Neural Flow — QA Report

Reviewer: qa. Date: 2026-09-26. Server was started with `npm start`, every endpoint was exercised with curl, and `src/app.js` was run in jsdom against the live server (jsdom is installed in the scratchpad, not in the repo). The server was stopped afterwards and port 3000 is free.

**Result: 68 checks — 68 PASS, 0 FAIL after the fixes. The first pass was 64 checks with 58 PASS and 6 FAIL; all 6 failures are fixed and re-verified, plus 4 new checks added for the fixes.**

## Backend

| # | Check | Result |
|---|-------|--------|
| B1.1 | `npm start` boots and listens on 3000 | PASS |
| B1.2 | `package.json` has a `start` script and an `express` dependency | PASS |
| B1.3 | `GET /` returns 200 `text/html` | PASS |
| B1.4 | `GET /styles.css` returns 200 `text/css` | PASS |
| B1.5 | `GET /app.js` returns 200 JS | PASS |
| B1.6 | Missing static file returns 404 without crashing (HTML "Cannot GET" page) | PASS |
| B1.7 | Only the frontend assets are served (`/server.js`, `/src/server.js`, `/package.json` and traversal all 404 JSON) | PASS (was FAIL, BUG-1 fixed) |
| B1.8 | `/index.html` alias and `/` both serve the page | PASS |
| B2.1 | `GET /api/features` returns 200 `application/json` | PASS |
| B2.2 | Exactly 3 items | PASS |
| B2.3 | Each item has non-empty `id`, `title`, `description`, `icon` | PASS |
| B3.1 | `GET /api/pricing` returns 200 `application/json` | PASS |
| B3.2 | Exactly 3 items | PASS |
| B3.3 | `price` is a number, `period` is "month", `features` is a string array, `highlighted` is a boolean | PASS |
| B3.4 | Exactly one tier is highlighted (Pro) | PASS |
| B4.1 | Valid contact payload returns 200 `{ok:true,message}` | PASS |
| B4.2 | Submission is logged to the server console | PASS |
| B4.3 | Each missing field (name, email, message) returns 400 `{ok:false,error}` | PASS |
| B4.4 | Empty `{}` or no body returns 400 JSON | PASS |
| B4.5 | Whitespace-only fields return 400 | PASS |
| B4.6 | Malformed email is rejected (`foo` → 400) | PASS |
| B4.6b | Stricter email validation: `a@b`, `@` and `a b@c` are rejected | PASS (was FAIL, BUG-2 fixed) |
| B4.6c | Length caps enforced: name 101, email 255 and message 5001 return 400; message of 5000 returns 200; a 100 KB dotted email gets 400 in ~13 ms (no regex slowdown) | PASS |
| B4.7 | Non-string values (number, object, array) return 400 without crashing | PASS |
| B4.8 | Malformed JSON returns JSON `{ok:false,error:"Malformed request body"}` 400, and a 200 KB body returns JSON 413, with no stack or paths | PASS (was FAIL, BUG-3 fixed) |
| B4.9 | Oversized body is bounded (100 KB default; 200 KB and 2 MB both got 413, process survived) | PASS |
| B4.10 | Log output cannot be forged with newlines (the log shows `"name":"Ada\nFAKE"` on one line) | PASS (was FAIL, BUG-4 fixed) |
| B4.11 | A `text/plain` body returns 400 JSON, not a crash | PASS |
| B5.1 | Unknown `GET /api/xyz` returns 404 `{ok:false,error:"Not found"}` | PASS |
| B5.2 | Unknown `POST /api/xyz` returns 404 JSON | PASS |
| B5.3 | Wrong method on a known route (`POST /api/features`) returns 404 JSON | PASS |
| B5.4 | `X-Powered-By` header is no longer sent; unknown non-API paths return JSON 404 | PASS |
| B6.1 | README documents install, start, port override and every endpoint with examples | PASS |

## Frontend

| # | Check | Result |
|---|-------|--------|
| F1.1 | Valid document: doctype, `lang="en"`, charset, viewport, title, meta description | PASS |
| F1.2 | Hero has an h1, a sub-headline and two CTAs | PASS |
| F1.3 | Features grid `#feature-grid` is populated from the API (3 `.feature-card`, `data-state=live` in jsdom) | PASS |
| F1.4 | Pricing grid `#pricing-grid` is populated from the API (3 `.price-card`, 1 highlighted) | PASS |
| F1.5 | Contact form has name, email and message fields plus a submit button | PASS |
| F1.6 | All in-page anchors (`#top`, `#features`, `#pricing`, `#contact`) match IDs; `styles.css` and `app.js` resolve | PASS |
| F1.7 | Dark theme (`#0a0c12` background, light text) | PASS |
| F2.1 | Fetches `/api/features` (relative URL) | PASS |
| F2.2 | Fetches `/api/pricing` | PASS |
| F2.3 | Field names match the API: `icon`, `title`, `description`, `name`, `price`, `period`, `features`, `highlighted` | PASS |
| F2.4 | Form POSTs `/api/contact` as JSON `{name,email,message}` with `Content-Type: application/json` | PASS |
| F2.5 | Success shows the server message, clears the form and uses `form-status--ok`; a 400 shows the server error with `form-status--error` (jsdom) | PASS |
| F2.6 | Network failure and non-JSON response are handled with a generic message (code review of `app.js:136-151`) | PASS |
| F2.7 | Fallback: static cards stay in place if a fetch fails (`app.js:47-50`, `app.js:95-97`) | PASS |
| F2.8 | Submit button is disabled while the request is in flight and re-enabled in `finally` | PASS |
| F2.9 | Price formatting gives `$0/month`, `$49/month`, `$499/month` | PASS |
| F2.10 | Highlighted tier has `price-card--highlighted` and a "Most teams choose this" tag | PASS |
| F3.1 | API strings are passed through `escapeHtml` before `innerHTML` (`app.js:31-33`, `app.js:75-79`) | PASS |
| F3.2 | No debug leftovers; only a `console.warn` on fetch failure | PASS |
| F4.1 | Every input has a `<label for>` | PASS |
| F4.2 | Input types (`email`), `name`, `autocomplete` and `required` are set | PASS |
| F4.3 | `#form-status` has `role="status"` and `aria-live="polite"` | PASS |
| F4.4 | One h1, h2 per section, h3 per card | PASS |
| F4.5 | Landmarks: header, nav with `aria-label`, main, footer | PASS |
| F4.6 | Visible `:focus-visible` outline (`styles.css:108`) | PASS |
| F4.6b | Muted text meets WCAG AA 4.5:1 contrast (`--text-faint` is now #8890a6: 6.13 on bg, 5.95 on bg-soft, 5.54 on cards, 5.14 on the highlighted card) | PASS (was FAIL, BUG-5 fixed) |
| F4.7 | Decorative SVG and emoji icons are `aria-hidden` | PASS |
| F5.1 | Breakpoints at 900px and 640px collapse the grids; `prefers-reduced-motion` is handled | PASS |
| F5.2 | Every class used in the HTML and JS has a CSS rule (`.header-cta` added at `styles.css:224`) | PASS (was FAIL, BUG-6 fixed) |
| F5.3 | At 640px and below the nav is shown as a wrapped row under the logo and CTA (`styles.css` 640px block), not hidden. CSS reviewed only, not rendered in a browser | PASS |
| F6.1 | `node --check src/app.js` passes | PASS |
| F6.2 | All four IDs used in JS exist in the HTML; `form.elements.name/email/message` resolve | PASS |
| F6.3 | Script is at the end of `<body>`. No uncaught JS errors in jsdom against the live server | PASS |

## Integration

| # | Check | Result |
|---|-------|--------|
| I1 | Frontend field names and request and response shapes match the backend exactly | PASS |
| I2 | jsdom end-to-end run against the live server: features and pricing render, empty-field, invalid-email and valid submissions behave correctly, the button re-enables, the server logs the valid one | PASS |

## Failures found in the first pass (all fixed and re-verified)

### BUG-1 (medium) — FIXED: server source is publicly served
- `src/server.js:12`: `express.static(path.join(__dirname))` serves the whole `src/` directory. `curl localhost:3000/server.js` returns 200 with the full server source. Nothing sensitive is in it today, but any secret added later would be exposed. `package.json` is not reachable, and path traversal returned 404.
- Fix: move the frontend to `src/public/` and serve that, or move `server.js` out of `src/`. Or serve only the three assets explicitly. Note that `package.json`'s `start` script and the README then need updating.

### BUG-2 (low) — FIXED: weak email validation
- `src/server.js:94`: only checks `email.includes('@')`. `a@b`, `@` and `a b@c` all return 200 and get logged.
- Fix: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())`. Consider a length cap on all three fields (e.g. name 100, email 254, message 5000).

### BUG-3 (low) — FIXED: malformed JSON returns an HTML stack trace
- `src/server.js:8`: no error-handling middleware. `POST /api/contact` with `{bad json` returns 400 `text/html` containing the stack trace with absolute filesystem paths. The 413 case does the same. The spec says invalid input gets `{ok:false,error}`. The frontend is unaffected because it always sends valid JSON and falls back to a generic message.
- Fix: add after the routes: `app.use((err, req, res, next) => { const status = err.status || 500; res.status(status).json({ ok: false, error: status === 413 ? 'Payload too large' : status === 400 ? 'Invalid JSON' : 'Server error' }); });`

### BUG-4 (low) — FIXED: log forging via newlines
- `src/server.js:101`: `console.log('New contact submission:', { name, email, message })`. A name of `"Ada\nFAKE LOG LINE"` was logged with the raw newline (visible in the server log).
- Fix: `JSON.stringify` the object in the log line, or strip control characters.

### BUG-5 (low) — FIXED: muted text fails WCAG AA contrast
- `--text-faint` (`#6b7288`, `styles.css:21`) has a contrast of 4.08:1 on `#0a0c12` and 3.69:1 on the `#141826` card surface, below the 4.5:1 needed for small text. It is used for the hero stat labels (`styles.css:269`), the price period (`styles.css:477`) and the footer (`styles.css:621`).
- Fix: lighten to about `#8890a6` (about 6:1 on `#0a0c12`, about 5.4:1 on `#141826`).

### BUG-6 (trivial) — FIXED: unused class
- `src/index.html:23` uses `header-cta`, which has no rule in `styles.css`. The button is styled via `btn btn-ghost`, so nothing is visibly broken. Drop the class or add a rule.

## Notes (not scored)
- **Resolved since the first pass:** the mobile nav (now a wrapped row at 640px and below), `X-Powered-By`, and the `pixel-purge` repository/bugs/homepage fields in `package.json` (confirmed removed).
- **Missing `.gitignore`:** `node_modules/` still shows as untracked. The lead has said they will handle it at commit time.
- **`package.json`:** the stock `test` script (`exit 1`) and `"directories": {"test": "tests"}` remain. Harmless.
- **Google Fonts:** the page loads Sora and Inter from Google Fonts; without network it falls back to `system-ui`, so it degrades safely.
- **Not verified:** the 640px layout was checked by reading the CSS only, not rendered in a browser. jsdom does not do layout.
- **Static allow-list:** the server serves only `/`, `/index.html`, `/styles.css` and `/app.js`. Any new asset (favicon, image, extra script) will need adding to `STATIC_FILES` in `src/server.js:14`.
- **Client-side email check:** the form uses `novalidate` and only checks for empty fields on the client. Email format errors come from the server, which the page shows correctly.

## Re-check status
Re-checked on 2026-09-26 after "Backend fixes landed" and "Frontend fixes landed". Full live run (curl of every endpoint and edge case, plus the jsdom end-to-end run) passed with no JS errors. The server was stopped afterwards and port 3000 is free.
