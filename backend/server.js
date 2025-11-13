// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Feature routers
import optinRouter from './routes/optin.js';
import checkoutRouter from './routes/checkout.js';
import paymentsRouter from './routes/payments.js';
import stripeWebhook from './routes/stripe-webhook.js';

// Resolve dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/**
 * ✅ CORS Configuration — allows local dev + Render
 */
const allowedOrigins = [
  'http://127.0.0.1:8080',
  'http://localhost:8080',
  'http://127.0.0.1:4000',
  'http://localhost:4000',
  'https://bwr-starter.onrender.com'
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

/**
 * ✅ Body parser with raw body support for Stripe webhooks
 */
app.use(
  bodyParser.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

/**
 * ✅ Health endpoints
 */
app.get('/', (_req, res) => res.send('✅ BWR API is running'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true, service: 'bwr-backend' }));

/**
 * ✅ Serve static landing and widget files
 */
app.use('/landing', express.static(path.resolve(__dirname, '../frontend/landing')));
app.use('/iframe-demo', express.static(path.resolve(__dirname, '../frontend/widget')));

/**
 * ✅ Serve widget.js directly for embedding
 */
app.get('/widget.js', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/widget/src/main.js'));
});

/**
 * ✅ Business logic routes
 */
app.use('/api/opt-in', optinRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/payments', paymentsRouter);

/**
 * ✅ Stripe webhook
 */
app.use('/webhooks/stripe', stripeWebhook);

/**
 * ✅ Error handlers
 */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('🔥 Server error:', err);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

/**
 * ✅ Start server
 */
const port = Number(process.env.PORT || 4000);
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 BWR API listening on port ${port}`);
});

