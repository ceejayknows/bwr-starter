import { pool } from '../db/pool.js'
import { enqueue } from './queue.js'
import { createDraftOrder } from './shopify.js'

export async function onRestock({ merchantId, productId }) {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `select * from waitlist_entries 
       where merchant_id=$1 and product_id=$2 and status='queued'
       order by created_at asc limit 100`, [merchantId, productId]
    )
    rows.forEach(entry => enqueue({ type: entry.wants_autopurchase ? 'autopurchase' : 'notify', entry }))
  } finally {
    client.release()
  }
}

export async function handleTask(task) {
  const { type, entry } = task
  if (type === 'notify') {
    console.log('Notify', entry.email)
  } else {
    const draft = await createDraftOrder({
      lineItems: [{ variantId: entry.shopify_variant_id, quantity: 1 }],
      customerEmail: entry.email,
      note: 'Auto-purchase on restock'
    })
    console.log('Draft order created', draft)
  }
}
