// Placeholder Shopify helpers
export async function verifyWebhook(req) {
  // TODO: compute HMAC per Shopify docs using APP_SECRET and compare header
  return true
}

export async function createDraftOrder({ lineItems, customerEmail, note }) {
  // TODO: call Shopify Admin API to create a draft order and send invoice
  return { id: 'do_123', invoiceUrl: 'https://example.com/invoice/abc' }
}
