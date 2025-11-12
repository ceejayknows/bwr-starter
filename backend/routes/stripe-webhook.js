// backend/routes/stripe-webhook.js
import express from 'express';
import Stripe from 'stripe';
import 'dotenv/config';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

/**
 * ✅ Stripe webhook handler
 * Must receive raw body from server.js -> express.raw({ type: 'application/json' })
 */
router.post('/', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ Missing STRIPE_WEBHOOK_SECRET in .env');
    return res.status(500).send('Server misconfigured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Log basic info
  console.log(`✅ Received Stripe event: ${event.type}`);

  switch (event.type) {
    case 'setup_intent.succeeded': {
      const setupIntent = event.data.object;
      console.log('💳 SetupIntent succeeded for:', setupIntent.customer);
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log('✅ PaymentIntent succeeded:', paymentIntent.id);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.warn('❌ PaymentIntent failed:', paymentIntent.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
