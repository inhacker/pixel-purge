# Neural Flow

Neural Flow is a fictional AI startup's marketing site and API: a landing
page (served from `src/`) plus a small Express.js backend that powers the
page's dynamic content (feature list, pricing tiers, and a contact form).

## Install

```bash
npm install
```

## Run

```bash
npm start
```

By default the server listens on **http://localhost:3000**. Set the `PORT`
environment variable to use a different port, e.g. `PORT=4000 npm start`.

The server serves the frontend from `src/` via an explicit allow-list:
`GET /` (and `/index.html`) returns `src/index.html`, plus `/styles.css`
and `/app.js`. Any other non-`/api` path (e.g. `/server.js`,
`/package.json`) returns `404`. If you add new frontend files, add them to
the `STATIC_FILES` map in `src/server.js`.

## API Endpoints

### `GET /api/features`

Returns the 3 AI features shown on the landing page.

**Request**

```
GET /api/features
```

**Response** `200 OK`

```json
[
  {
    "id": "feature-1",
    "title": "Adaptive Learning Models",
    "description": "Neural Flow continuously fine-tunes itself on your data, improving accuracy the more you use it.",
    "icon": "🧠"
  },
  {
    "id": "feature-2",
    "title": "Real-Time Inference",
    "description": "Get predictions and insights in milliseconds with our low-latency inference pipeline.",
    "icon": "⚡"
  },
  {
    "id": "feature-3",
    "title": "Seamless Integrations",
    "description": "Drop Neural Flow into your existing stack with simple REST APIs and SDKs for every major language.",
    "icon": "🔌"
  }
]
```

### `GET /api/pricing`

Returns the 3 pricing tiers shown on the landing page.

**Request**

```
GET /api/pricing
```

**Response** `200 OK`

```json
[
  {
    "id": "starter",
    "name": "Starter",
    "price": 0,
    "period": "month",
    "features": ["1,000 API calls / month", "Community support", "Single project"],
    "highlighted": false
  },
  {
    "id": "pro",
    "name": "Pro",
    "price": 49,
    "period": "month",
    "features": ["100,000 API calls / month", "Priority email support", "Up to 10 projects", "Advanced analytics"],
    "highlighted": true
  },
  {
    "id": "enterprise",
    "name": "Enterprise",
    "price": 499,
    "period": "month",
    "features": ["Unlimited API calls", "Dedicated support & SLA", "Unlimited projects", "Custom model training"],
    "highlighted": false
  }
]
```

### `POST /api/contact`

Accepts a contact form submission. All of `name`, `email`, and `message`
must be non-empty. `email` must look like `user@domain.tld` (matches
`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Length limits: `name` ≤ 100, `email` ≤ 254,
`message` ≤ 5000 characters. Violations return `400` with
`{ "ok": false, "error": "..." }`.

**Request**

```
POST /api/contact
Content-Type: application/json

{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "message": "I'd like a demo of Neural Flow."
}
```

**Response** `200 OK`

```json
{ "ok": true, "message": "Thanks, we'll be in touch." }
```

On success, the submission is also logged to the server console as a single
JSON-encoded line.

**Invalid request example**

```
POST /api/contact
Content-Type: application/json

{ "name": "", "email": "not-an-email", "message": "" }
```

**Response** `400 Bad Request`

```json
{ "ok": false, "error": "Name is required" }
```

### Errors

All errors return JSON `{ "ok": false, "error": "..." }` with no stack
traces: `400` for malformed JSON, `413` for oversized bodies (default limit
100 kb), `404` for unknown paths, `500` otherwise.

### Unknown `/api/*` routes

Any request to an `/api/*` path that isn't defined above returns:

**Response** `404 Not Found`

```json
{ "ok": false, "error": "Not found" }
```
