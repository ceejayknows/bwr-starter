import express from 'express'
import { pool } from '../db/pool.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    console.log('OPTIN BODY:', req.body)
    const { merchantDomain, shopifyProductId, shopifyVariantId, email, wantsAutopurchase } = req.body
    if (!merchantDomain || !shopifyProductId || !shopifyVariantId || !email) {
      console.log('OPTIN ERROR: missing fields')
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const client = await pool.connect()
    try {
      await client.query('begin')
      const m = await client.query(
        `insert into merchants (shop_domain) values ($1)
         on conflict (shop_domain) do update set shop_domain=excluded.shop_domain
         returning id`, [merchantDomain]
      )
      const merchantId = m.rows[0].id

      const p = await client.query(
        `insert into products (merchant_id, shopify_product_id, shopify_variant_id)
         values ($1,$2,$3)
         on conflict (merchant_id, shopify_variant_id) do update set shopify_product_id=excluded.shopify_product_id
         returning id`, [merchantId, shopifyProductId, shopifyVariantId]
      )
      const productId = p.rows[0].id

      const w = await client.query(
        `insert into waitlist_entries (merchant_id, product_id, email, wants_autopurchase)
         values ($1,$2,$3,$4) returning id`, [merchantId, productId, email, !!wantsAutopurchase]
      )
      await client.query('commit')
      console.log('OPTIN OK waitlistId:', w.rows[0].id)
      res.json({ ok: true, waitlistId: w.rows[0].id })
    } catch (e) {
      await client.query('rollback')
      console.error('OPTIN TX ERROR:', e)
      res.status(500).json({ error: 'Server error' })
    } finally {
      client.release()
    }
  } catch (e) {
    console.error('OPTIN HANDLER ERROR:', e)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
