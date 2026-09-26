const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static frontend: explicit allow-list only, so server.js etc. are never served.
const STATIC_FILES = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/styles.css': 'styles.css',
  '/app.js': 'app.js',
};

app.get(Object.keys(STATIC_FILES), (req, res, next) => {
  res.sendFile(path.join(__dirname, STATIC_FILES[req.path]), (err) => {
    if (err) next(err);
  });
});

// --- API routes ---

app.get('/api/features', (req, res) => {
  res.json([
    {
      id: 'feature-1',
      title: 'Adaptive Learning Models',
      description:
        'Neural Flow continuously fine-tunes itself on your data, improving accuracy the more you use it.',
      icon: '🧠',
    },
    {
      id: 'feature-2',
      title: 'Real-Time Inference',
      description:
        'Get predictions and insights in milliseconds with our low-latency inference pipeline.',
      icon: '⚡',
    },
    {
      id: 'feature-3',
      title: 'Seamless Integrations',
      description:
        'Drop Neural Flow into your existing stack with simple REST APIs and SDKs for every major language.',
      icon: '🔌',
    },
  ]);
});

app.get('/api/pricing', (req, res) => {
  res.json([
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      period: 'month',
      features: [
        '1,000 API calls / month',
        'Community support',
        'Single project',
      ],
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 49,
      period: 'month',
      features: [
        '100,000 API calls / month',
        'Priority email support',
        'Up to 10 projects',
        'Advanced analytics',
      ],
      highlighted: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 499,
      period: 'month',
      features: [
        'Unlimited API calls',
        'Dedicated support & SLA',
        'Unlimited projects',
        'Custom model training',
      ],
      highlighted: false,
    },
  ]);
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ ok: false, error: 'Name is required' });
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ ok: false, error: 'Email is required' });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ ok: false, error: 'Email must be valid' });
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ ok: false, error: 'Message is required' });
  }
  if (name.length > MAX_NAME) {
    return res
      .status(400)
      .json({ ok: false, error: `Name must be at most ${MAX_NAME} characters` });
  }
  if (email.length > MAX_EMAIL) {
    return res
      .status(400)
      .json({ ok: false, error: `Email must be at most ${MAX_EMAIL} characters` });
  }
  if (message.length > MAX_MESSAGE) {
    return res.status(400).json({
      ok: false,
      error: `Message must be at most ${MAX_MESSAGE} characters`,
    });
  }

  // JSON.stringify escapes newlines so a submission can't forge log lines.
  console.log('New contact submission:', JSON.stringify({ name, email, message }));

  return res.status(200).json({
    ok: true,
    message: "Thanks, we'll be in touch.",
  });
});

// Unknown /api/* routes -> 404 JSON
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Everything else -> 404 (JSON, no file paths leaked)
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Final error handler: JSON only, never leak stack traces or paths.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode;
  if (status === 413) {
    return res.status(413).json({ ok: false, error: 'Request body too large' });
  }
  if (status === 400 || err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, error: 'Malformed request body' });
  }
  if (status === 404 || err.code === 'ENOENT') {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
  console.error('Unhandled error:', err.message);
  return res.status(500).json({ ok: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Neural Flow server listening on http://localhost:${PORT}`);
});
