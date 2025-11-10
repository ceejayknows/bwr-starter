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
 * ✅ FIXED CORS CONFIGURATION
 * Allows local testing + Render frontend access.
 */
const allowedOrigins = [
  'http://127.0.0.1:8080',            // local test server
  'http://localhost:8080',            // alternate local dev
  'https://bwr-starter.onrender.com', // your live Render backend
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log('❌ Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

/**
 * ✅ Body parser setup
 * Keeps raw body for Stripe webhook verification.
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
 * Used by widget and Render to verify API availability.
 */
app.get('/', (_req, res) => res.send('✅ BWR API is running'));
app.get('/health', (_req, res) =>
  res.status(200).json({ ok: true, service: 'bwr-backend' })
);

/**
 * ✅ Core business logic routes
 */
app.use('/api/opt-in', optinRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/payments', paymentsRouter);

/**
 * ✅ Stripe webhook (events: setup_intent.succeeded, payment_intent.*)
 */
app.use('/webhooks/stripe', stripeWebhook);

/**
 * ✅ Error handling
 */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

/**
 * ✅ Start server
 */
const port = Number(process.env.PORT || 4000);
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 BWR API listening on port ${port}`);
});
