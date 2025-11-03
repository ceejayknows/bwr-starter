// backend/routes/payments.js
import express from 'express';
import { pool } from '../db/pool.js';
import { ensureCustomerByEmail, createSetupIntent, createPaymentIntent, stripe } from '../lib/stripe.js';

const router = express.Router();

/**
 * POST /api/payments/setup-intent
 * Body: { email, waitlistId }
 * Returns client_secret for Stripe.js to confirm and save a card.
 */
router.post('/setup-intent', async (req, res) => {
  try {
    const { email, waitlistId } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    // Ensure a Stripe customer
    const customer = await ensureCustomerByEmail(email);

    // Create SetupIntent with metadata
    const si = await createSetupIntent(customer.id, { waitlistId: waitlistId || '' });

    // Save Stripe customer ID into waitlist entry if provided
    if (waitlistId) {
      await pool.query(
        'UPDATE waitlist_entries SET stripe_customer_id=$1 WHERE id=$2',
        [customer.id, waitlistId]
      );
    }

    res.json({
      ok: true,
      clientSecret: si.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      customerId: customer.id,
    });
  } catch (e) {
    console.error('SETUP_INTENT ERROR:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/payments/charge
 * Body: { waitlistId, amount, currency }
 * Creates an off-session charge using saved card.
 */
router.post('/charge', async (req, res) => {
  try {
    const { waitlistId, amount, currency = 'usd' } = req.body;
    if (!waitlistId || !amount) return res.status(400).json({ error: 'Missing fields' });

    // Look up waitlist entry
    const { rows } = await pool.query(
      'SELECT id, email, stripe_customer_id FROM waitlist_entries WHERE id=$1 LIMIT 1',
      [waitlistId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Waitlist not found' });
    const entry = rows[0];
    if (!entry.stripe_customer_id) return res.status(400).json({ error: 'Customer not on file' });

    // Fetch Stripe customer and their default payment method
    const customer = await stripe.customers.retrieve(entry.stripe_customer_id);
    const defaultPM = customer.invoice_settings?.default_payment_method;
    if (!defaultPM) return res.status(400).json({ error: 'No default payment method on file' });

    // Charge the card
    const pi = await createPaymentIntent({
      amount,
      currency,
      customer: entry.stripe_customer_id,
      payment_method: defaultPM,
      metadata: { waitlistId },
    });

    res.json({ ok: true, paymentIntentId: pi.id, status: pi.status });
  } catch (e) {
    console.error('CHARGE ERROR:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
