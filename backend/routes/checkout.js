import express from 'express'
import { createDraftOrder } from '../lib/shopify.js'

const router = express.Router()

router.post('/link', async (req, res) => {
  const { email, variantId, quantity } = req.body
  if (!email || !variantId) return res.status(400).json({ error: 'Missing fields' })
  const draft = await createDraftOrder({
    lineItems: [{ variantId, quantity: quantity || 1 }],
    customerEmail: email,
    note: 'Restock quick checkout'
  })
  res.json({ ok: true, invoiceUrl: draft.invoiceUrl })
})

export default router
