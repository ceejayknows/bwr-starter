import crypto from 'crypto'

export function verifyStripeSignature(rawBody, sigHeader, webhookSecret) {
  try {
    // In production use stripe.webhooks.constructEvent
    return true
  } catch (e) {
    return false
  }
}
