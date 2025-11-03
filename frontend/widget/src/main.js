console.log('BWR widget loaded (main.js)');

import BwrWidget from './BwrWidget.js';

// ✅ Check that Stripe.js loaded
if (!window.Stripe) {
  console.error("❌ Stripe.js not found! Make sure <script src='https://js.stripe.com/v3/'></script> is in index.html <head>.");
  const root = document.getElementById('bwr-root');
  root.innerHTML = `<div style="color:red;font-weight:bold">Stripe.js not loaded. Check index.html.</div>`;
} else {
  (async () => {
    try {
      // Test backend health
      const r = await fetch('http://localhost:4000/health');
      console.log('Health status:', r.status, await r.text());
    } catch (e) {
      console.error('Health fetch failed:', e);
    }
  })();

  // Mount widget
  const root = document.getElementById('bwr-root');
  root.innerHTML = '';

  const el = BwrWidget({
    product: { id: 'gid://shopify/Product/123', variantId: 'gid://shopify/ProductVariant/456', title: 'Demo Product' },
    merchantDomain: 'demo-shop.myshopify.com',
    apiBase: 'http://localhost:4000'
  });
  root.appendChild(el);
}
