// ✅ Buy When Restocked - Stripe + Waitlist Widget

let stripe, elements, cardElement;

async function ensureStripe(publishableKey) {
  if (!stripe) {
    stripe = window.Stripe(publishableKey); // Initialize Stripe
    elements = stripe.elements();
    cardElement = elements.create('card');
  }

  // Create container to mount the card input
  const mount = document.createElement('div');
  mount.id = 'bwr-card-element';
  mount.style.margin = '8px 0';

  const inner = document.createElement('div');
  inner.id = 'stripe-card-inner';
  mount.appendChild(inner);

  return mount;
}

export default function BwrWidget({ product, merchantDomain, apiBase }) {
  const card = document.createElement('div');
  card.className = 'bwr-card';
  card.style.border = '1px solid #ccc';
  card.style.padding = '1rem';
  card.style.borderRadius = '8px';
  card.style.fontFamily = 'Arial, sans-serif';

  card.innerHTML = `
    <div><strong>Buy When Restocked</strong></div>
    <div class="bwr-row">
      <input class="bwr-input" id="bwr-email" type="email" placeholder="Email address" />
    </div>
    <div class="bwr-row">
      <label><input type="radio" name="bwr-choice" value="auto" /> Auto-purchase when restocked</label>
    </div>
    <div class="bwr-row">
      <label><input type="radio" name="bwr-choice" value="link" checked /> Send me a 1-click checkout link</label>
    </div>
    <div class="bwr-row">
      <button class="bwr-btn" id="bwr-submit">Submit</button>
    </div>
    <div class="bwr-row" id="bwr-status" style="font-size: 12px; color: #6b7280"></div>
  `;

  const submit = card.querySelector('#bwr-submit');
  const status = card.querySelector('#bwr-status');
  const radioAuto = card.querySelector('input[value="auto"]');

  // ✅ When user selects Auto-purchase
  radioAuto.addEventListener('change', async () => {
    if (!radioAuto.checked) return;

    const email = card.querySelector('#bwr-email').value.trim();
    if (!email) {
      status.textContent = 'Enter your email first.';
      return;
    }

    try {
      // 1️⃣ Create waitlist entry
      const optRes = await fetch(`${apiBase}/api/opt-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantDomain,
          shopifyProductId: product.id,
          shopifyVariantId: product.variantId,
          email,
          wantsAutopurchase: true,
        }),
      });

      const optData = await optRes.json();
      if (!optRes.ok) {
        status.textContent = optData.error || 'Error creating waitlist entry.';
        return;
      }

      const waitlistId = optData.waitlistId;

      // 2️⃣ Ask server for a SetupIntent
      const siRes = await fetch(`${apiBase}/api/payments/setup-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, waitlistId }),
      });

      const siData = await siRes.json();
      if (!siRes.ok) {
        status.textContent = siData.error || 'Could not start card setup.';
        return;
      }

      // 3️⃣ Mount Stripe card input
      const mount = await ensureStripe(siData.publishableKey);
      status.textContent = 'Enter card details to save for auto-purchase.';
      const firstRow = card.querySelector('.bwr-row');
      firstRow.after(mount);

      // Mount the Stripe Element
      setTimeout(() => {
        cardElement.mount('#stripe-card-inner');
      }, 0);

      // Save clientSecret for later use
      card.dataset.siClientSecret = siData.clientSecret;
    } catch (err) {
      console.error('Auto-purchase setup error:', err);
      status.textContent = 'Error initializing auto-purchase.';
    }
  });

  // ✅ Handle Submit button
  submit.addEventListener('click', async () => {
    const email = card.querySelector('#bwr-email').value.trim();
    const choice = card.querySelector('input[name="bwr-choice"]:checked').value;
    const wantsAutopurchase = choice === 'auto';

    try {
      if (!wantsAutopurchase) {
        // Normal link waitlist
        const res = await fetch(`${apiBase}/api/opt-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantDomain,
            shopifyProductId: product.id,
            shopifyVariantId: product.variantId,
            email,
            wantsAutopurchase: false,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          status.textContent = data.error || 'Error joining waitlist.';
          return;
        }

        // Ask backend to create a checkout link
        const linkRes = await fetch(`${apiBase}/api/checkout/link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, variantId: product.variantId, quantity: 1 }),
        });

        const linkData = await linkRes.json();
        status.innerHTML = linkData.invoiceUrl
          ? `<a href="${linkData.invoiceUrl}" target="_blank">Checkout now</a>`
          : 'You’ll get a 1-click checkout link when restocked.';
        return;
      }

      // Auto-purchase flow: confirm card setup
      const clientSecret = card.dataset.siClientSecret;
      if (!clientSecret) {
        status.textContent = 'Select Auto-purchase first and wait for the card form.';
        return;
      }

      const { error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        status.textContent = error.message || 'Card setup failed.';
        return;
      }

      status.textContent = '✅ Card saved for auto-purchase on restock.';
    } catch (e) {
      console.error(e);
      status.textContent = 'Network error. Try again.';
    }
  });

  return card;
}
