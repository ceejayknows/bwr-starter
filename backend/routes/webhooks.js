import express from 'express'
import { verifyWebhook } from '../lib/shopify.js'
import { pool } from '../db/pool.js'
import { onRestock } from '../lib/restock.js'

const router = express.Router()

router.post('/inventory', async (req, res) => {
  const ok = await verifyWebhook(req)
  if (!ok) return res.status(401).send('Invalid signature')

  const { merchantDomain, shopifyVariantId } = req.body

  const client = await pool.connect()
  try {
    const { rows } = await client.query(`
      select p.id as product_id, m.id as merchant_id
      from products p 
      join merchants m on p.merchant_id = m.id
      where m.shop_domain=$1 and p.shopify_variant_id=$2
      limit 1
    `, [merchantDomain, shopifyVariantId])
    if (rows.length === 0) return res.json({ ok: true })

    await onRestock({ merchantId: rows[0].merchant_id, productId: rows[0].product_id })
    res.json({ ok: true })
  } catch (e) {
    console.error('WEBHOOK ERROR:', e)
    res.status(500).json({ error: 'Server error' })
  } finally {
    client.release()
  }
})

export default router
