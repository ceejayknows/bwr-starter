// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// routers
import optinRouter from './routes/optin.js';
import checkoutRouter from './routes/checkout.js';
import paymentsRouter from './routes/payments.js';
import stripeWebhook from './routes/stripe-webhook.js';

const app = express();

// __dirname helper for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ----------------------  ✅  CORS CONFIG  ---------------------- */
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
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

/* ----------------------  ✅  BODY PARSER  ---------------------- */
app.use(
  bodyParser.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

/* ----------------------  ✅  STATIC ROUTES  ---------------------- */
// serve landing page at /landing
app.use('/landing', express.static(path.join(__dirname, '../frontend/landing')));

// serve widget test page at /iframe-demo
app.use('/iframe-demo', express.static(path.join(__dirname, '../frontend/widget')));

/* ----------------------  ✅  HEALTH + API ROUTES  ---------------------- */
app.get('/', (_req, res) => res.send('✅ BWR API is running'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true, service: 'bwr-backend' }));

app.use('/api/opt-in', optinRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/payments', paymentsRouter);
app.use('/webhooks/stripe', stripeWebhook);

/* ----------------------  ✅  ERRORS  ---------------------- */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('🔥 Server error:', err.message);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

/* ----------------------  ✅  START  ---------------------- */
const port = Number(process.env.PORT || 4000);
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 BWR API listening on port ${port}`);
});

