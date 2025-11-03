// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Feature routers (make sure these files exist)
import optinRouter from './routes/optin.js';
import checkoutRouter from './routes/checkout.js';
import paymentsRouter from './routes/payments.js';       // Stripe SetupIntent/charge
import stripeWebhook from './routes/stripe-webhook.js';   // Stripe webhook handler

const app = express();

/** Allow local dev origins (http://localhost:*). Tighten for production. */
app.use(
  cors({
    origin: [/^http:\/\/localhost:\d+$/], // e.g., 5173 for your widget
    credentials: false,
  })
);

/**
 * Parse JSON and keep raw body for Stripe webhook signature verification.
 * NOTE: Mount bodyParser before webhook route; webhook uses req.rawBody.
 */
app.use(
  bodyParser.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf; // required for stripe.webhooks.constructEvent(...)
    },
  })
);

/** (Optional) serve your widget statically if you want: */
// import path from 'path';
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use('/widget', express.static(path.resolve(__dirname, '../frontend/widget')));

/** Health + root */
app.get('/', (_req, res) => res.send('BWR API is running. Try GET /health'));
app.get('/health', (_req, res) => res.json({ ok: true }));

/** Business routes */
app.use('/api/opt-in', optinRouter);
app.use('/api/checkout', checkoutRouter);

/** Stripe: app-side API (create SetupIntent, test charge) */
app.use('/api/payments', paymentsRouter);

/** Stripe: webhook endpoint (setup_intent.succeeded, payment_intent.*) */
app.use('/webhooks/stripe', stripeWebhook);

/** 404 + error handlers */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

/** Start server */
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`✅ API listening on :${port}`);
});
