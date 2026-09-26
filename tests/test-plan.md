# Neural Flow — Test Plan

Owner: qa. Scope: landing page (`src/index.html`, `src/styles.css`, `src/app.js`) and Express API (`src/server.js`) at http://localhost:3000.

Method: static code review + live exercise (`npm start`, `curl`, `node` scripts). Server is stopped afterwards so port 3000 is free.

## Backend

### B1. Startup and static serving
- B1.1 `npm install` / `npm start` boots with no errors and listens on port 3000
- B1.2 `package.json` has a `start` script and an `express` dependency
- B1.3 `GET /` returns 200 `text/html` (index.html)
- B1.4 `GET /styles.css` returns 200 `text/css`
- B1.5 `GET /app.js` returns 200 JavaScript
- B1.6 Non-API missing file (e.g. `/nope.html`) returns a sensible 404, not a crash

### B2. GET /api/features
- B2.1 200, `application/json`
- B2.2 Array of exactly 3 items
- B2.3 Each item has `id`, `title`, `description`, `icon`, all non-empty strings

### B3. GET /api/pricing
- B3.1 200, `application/json`
- B3.2 Array of exactly 3 items
- B3.3 Each item has `id`, `name`, `price` (number, not string), `period` === "month", `features` (array of strings), `highlighted` (boolean)
- B3.4 Exactly one tier is highlighted

### B4. POST /api/contact
- B4.1 Valid `{name, email, message}` returns 200 `{ ok: true, message }`
- B4.2 Submission is logged to the server console
- B4.3 Missing each field individually returns 400 `{ ok: false, error }`
- B4.4 Empty body / no body returns 400 JSON, not 500
- B4.5 Empty or whitespace-only strings return 400
- B4.6 Invalid email format (e.g. `foo`, `a@b`) returns 400
- B4.7 Non-string values (number, object, array) return 400 and do not crash
- B4.8 Malformed JSON body returns JSON error (400), not an HTML stack trace
- B4.9 Oversized fields are handled (length cap or express default body limit)
- B4.10 Log output is not injectable (newlines in fields)

### B5. Routing and errors
- B5.1 Unknown `GET /api/xyz` returns 404 JSON
- B5.2 Unknown `POST /api/xyz` returns 404 JSON
- B5.3 Wrong method on a known route (e.g. `POST /api/features`) returns 404/405 JSON
- B5.4 Response `Content-Type` and CORS are appropriate (same-origin, so CORS not required)

### B6. README
- B6.1 README documents install, start, and every endpoint with example payloads

## Frontend

### F1. Structure and content
- F1.1 `index.html` is valid: doctype, `lang`, charset, viewport meta, title
- F1.2 Hero section with headline and CTA
- F1.3 Features section with a grid container that is populated from the API
- F1.4 Pricing section with a 3-tier container that is populated from the API
- F1.5 Contact form with name, email, message fields and a submit button
- F1.6 All `href`/`src` references resolve (CSS/JS paths, in-page anchors `#features`, `#pricing`, `#contact` match section IDs)
- F1.7 Dark theme applied (dark background, light text)

### F2. API integration
- F2.1 Fetches `/api/features` (correct path, no hard-coded host)
- F2.2 Fetches `/api/pricing`
- F2.3 Reads the correct field names: features (`id`, `title`, `description`, `icon`); pricing (`name`, `price`, `period`, `features`, `highlighted`)
- F2.4 Form POSTs to `/api/contact` with `Content-Type: application/json` and body `{name, email, message}`
- F2.5 Handles `{ok:true}` (success message, form reset) and `{ok:false,error}` (shows server error)
- F2.6 Handles network failure / non-JSON response (no uncaught exception)
- F2.7 Loading states while fetching, and a fallback/error state if the fetch fails
- F2.8 Submit button disabled while a request is in flight (no double-submit)
- F2.9 Price formatting is sensible (e.g. `$29`, `/month`)
- F2.10 `highlighted` tier is visually distinguished

### F3. Security
- F3.1 API data is inserted with `textContent` or is escaped, not raw `innerHTML` (XSS)
- F3.2 No inline secrets or debug leftovers (`console.log` noise)

### F4. Accessibility
- F4.1 Every form input has an associated `<label for>` (or aria-label)
- F4.2 Inputs have the correct `type` (`email`), `name`, `required`, and `autocomplete`
- F4.3 Status/error messages live in an `aria-live` region
- F4.4 Heading hierarchy is sensible (one `h1`, then `h2`s)
- F4.5 Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`)
- F4.6 Visible `:focus` styles; text contrast on the dark theme is adequate
- F4.7 Decorative icons have `aria-hidden`; images have `alt`

### F5. Responsive and CSS
- F5.1 `@media` breakpoints collapse the grid and pricing table on mobile
- F5.2 No horizontal overflow at 375px (static review)
- F5.3 Every class used in HTML/JS has a matching rule in CSS (no orphaned or missing styles)

### F6. JS correctness
- F6.1 `node --check src/app.js` passes (syntax)
- F6.2 Every element ID or selector used in JS exists in the HTML
- F6.3 Script loading is safe (`defer`, or placed at the end of the body)

## Integration
- I1 Field names in the frontend match the backend response and request shapes exactly
- I2 The page's fetch URLs all resolve on the running server
- I3 End-to-end: simulate the form payload against the live server and confirm the server log line

## Output
Results go in `tests/report.md`: one PASS/FAIL line per check, with file:line and a suggested fix for each failure. Bugs go to the owning teammate (frontend-dev / backend-dev) for a fix, then I re-check and update the report.
