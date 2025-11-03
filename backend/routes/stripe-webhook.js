// backend/routes/stripe-webhook.js
import express from 'express';
import { stripe } from '../lib/stripe.js';
import { pool } from '../db/pool.js';

const router = express.Router();

router.post('/', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  (async () => {
    try {
      switch (event.type) {
        case 'setup_intent.succeeded': {
          const si = event.data.object;
          const waitlistId = si.metadata?.waitlistId || null;
          const pmId = si.payment_method;
          const customerId = si.customer;

          // Set default payment method for off-session charges
          await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: pmId },
          });

          if (waitlistId) {
            await pool.query(
              `UPDATE waitlist_entries
               SET stripe_customer_id=$1, stripe_pm_tokenized=true
               WHERE id=$2`,
              [customerId, waitlistId]
            );
          }

          console.log('✅ SetupIntent succeeded for customer:', customerId, 'waitlistId:', waitlistId);
          break;
        }

        case 'payment_intent.succeeded': {
          const pi = event.data.object;
          console.log('💰 Payment succeeded:', pi.id);
          break;
        }

        case 'payment_intent.payment_failed': {
          const pi = event.data.object;
          console.warn('❌ Payment failed:', pi.id, pi.last_payment_error?.message);
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('Webhook handling error:', e);
    }
  })();

  res.json({ received: true });
});

export default router;
