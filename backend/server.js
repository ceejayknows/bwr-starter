// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import optinRouter from './routes/optin.js';
import checkoutRouter from './routes/checkout.js';
import paymentsRouter from './routes/payments.js';
import stripeWebhook from './routes/stripe-webhook.js';

// Resolve current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* -------------------------------------------------------
   ✅ CORS SETUP
   Allows your local dev URLs + Render app
------------------------------------------------------- */
const allowedOrigins = [
  'http://127.0.0.1:8080',           // local widget test
  'http://localhost:8080',           // alternate local
  'https://bwr-starter.onrender.com' // live Render backend
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log('❌ Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

/* -------------------------------------------------------
   ✅ BODY PARSER (keep rawBody for Stripe)
------------------------------------------------------- */
app.use(
  bodyParser.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

/* -------------------------------------------------------
   ✅ STATIC FILE SERVING
   Serve landing + widget demos from frontend folder
------------------------------------------------------- */
app.use(
  '/frontend/landing',
  express.static(path.resolve(__dirname, '../frontend/landing'))
);
app.use(
  '/frontend/widget',
  express.static(path.resolve(__dirname, '../frontend/widget'))
);

/* -------------------------------------------------------
   ✅ IFRAME DEMO ROUTE
   Embeds the widget demo into a clean minimal page
------------------------------------------------------- */
app.get('/iframe-demo', (_req, res) => {
  const html = `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <title>Cenja Widget Demo</title>
    <style>
      html,body {
        margin:0; padding:0;
        height:100%; background:#f9fafb;
        font-family: Inter, system-ui, sans-serif;
        display:flex; align-items:center; justify-content:center;
      }
      iframe {
        width: 400px;
        height: 500px;
        border: 1px solid #ccc;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      }
    </style>
  </head>
  <body>
    <iframe src="/frontend/widget/test.html" title="Cenja Demo"></iframe>
  </body>
  </html>`;
  res.type('html').send(html);
});

/* -------------------------------------------------------
   ✅ BASIC HEALTH CHECKS
------------------------------------------------------- */
app.get('/', (_req, res) =>
  res.send('🚀 Cenja (BWR) API is live. Try GET /health or /iframe-demo')
);
app.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'bwr-backend', status: 'running' })
);

/* -------------------------------------------------------
   ✅ CORE BUSINESS ROUTES
------------------------------------------------------- */
app.use('/api/opt-in', optinRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/payments', paymentsRouter);

/* -------------------------------------------------------
   ✅ STRIPE WEBHOOK
------------------------------------------------------- */
app.use('/webhooks/stripe', stripeWebhook);

/* -------------------------------------------------------
   ✅ ERROR HANDLING
------------------------------------------------------- */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

/* -------------------------------------------------------
   ✅ START SERVER
------------------------------------------------------- */
const port = Number(process.env.PORT || 4000);
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Cenja backend running on port ${port}`);
});
