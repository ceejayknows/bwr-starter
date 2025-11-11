// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Import route handlers ---
import optinRouter from './routes/optin.js';
import checkoutRouter from './routes/checkout.js';
import paymentsRouter from './routes/payments.js';
import stripeWebhook from './routes/stripe-webhook.js';

const app = express();

// --------------------------------------------------------------------
// ✅ 1. CORS CONFIGURATION
// --------------------------------------------------------------------
const allowedOrigins = [
  'http://127.0.0.1:8080',            // local test server
  'http://localhost:8080',
  'https://bwr-starter.onrender.com', // your Render backend domain
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn('❌ Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// --------------------------------------------------------------------
// ✅ 2. BODY PARSER (Stripe-compatible)
// --------------------------------------------------------------------
app.use(
  bodyParser.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf; // required for Stripe signature verification
    },
  })
);

// --------------------------------------------------------------------
// ✅ 3. STATIC FILE SERVING
// --------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static folders for landing + widget
app.use('/landing', express.static(path.resolve(__dirname, '../frontend/landing')));
app.use('/widget', express.static(path.resolve(__dirname, '../frontend/widget')));

// Route: iframe demo
app.get('/iframe-demo', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/widget/test.html'));
});

// --------------------------------------------------------------------
// ✅ 4. HEALTH + ROOT ENDPOINTS
// --------------------------------------------------------------------
app.get('/', (_req, res) => res.send('✅ BWR API is running'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true, service: 'bwr-backend' }));

// --------------------------------------------------------------------
// ✅ 5. BUSINESS LOGIC ROUTES
// --------------------------------------------------------------------
app.use('/api/opt-in', optinRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/payments', paymentsRouter);
app.use('/webhooks/stripe', stripeWebhook);

// --------------------------------------------------------------------
// ✅ 6. ERROR HANDLING
// --------------------------------------------------------------------
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

// --------------------------------------------------------------------
// ✅ 7. START SERVER
// --------------------------------------------------------------------
const port = Number(process.env.PORT || 4000);
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 BWR API listening on port ${port}`);
});

