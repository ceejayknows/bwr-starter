// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Feature routers
import optinRouter from './routes/optin.js';
import checkoutRouter from './routes/checkout.js';
import paymentsRouter from './routes/payments.js';
import stripeWebhook from './routes/stripe-webhook.js';

const app = express();

/**
 * ✅ CORS CONFIG — allows local + production domains
 */
const allowedOrigins = [
  'http://127.0.0.1:8080',
  'http://localhost:8080',
  'https://bwr-starter.onrender.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn('❌ CORS blocked:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

/**
 * ✅ Stripe webhook needs RAW body, not parsed JSON.
 * This route must be declared *before* bodyParser.json().
 */
app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

/**
 * ✅ JSON parser for all other routes
 */
app.use(
  bodyParser.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

/**
 * ✅ Health check endpoints
 */
app.get('/', (_req, res) => res.send('✅ BWR API is running.'));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'bwr-backend' }));

/**
 * ✅ Main business routes
 */
app.use('/api/opt-in', optinRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/payments', paymentsRouter);

/**
 * ✅ Fallbacks & error handlers
 */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('🔥 Server error:', err);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

/**
 * ✅ Start the server
 */
const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 BWR API listening on port ${port}`);
});
