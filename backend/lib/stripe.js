// backend/lib/stripe.js
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** Reuse a customer by email, or create one */
export async function ensureCustomerByEmail(email) {
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length) return existing.data[0];
  return await stripe.customers.create({ email });
}

export async function createSetupIntent(customerId, metadata = {}) {
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
    metadata, // e.g., { waitlistId: '...' }
  });
}

export async function createPaymentIntent({ amount, currency, customer, payment_method, metadata = {} }) {
  return await stripe.paymentIntents.create({
    amount, // e.g., 5000 for $50.00
    currency, // 'usd', 'cad', ...
    customer,
    payment_method,
    confirm: true,
    off_session: true,
    metadata,
  });
}
