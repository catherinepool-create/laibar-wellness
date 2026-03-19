/* ============================================
   LAIBAR WELLNESS — Main Application Logic
   Single Product: Joint Support Supplement
   Stripe Checkout + Full E-Commerce
   ============================================ */

// --- Product Data (Single Product) ---
const PRODUCT = {
  id: 1,
  name: "Laibar Joint Support",
  tagline: "Multi-Action Joint Wellness Formula",
  priceOneTime: 64.99,
  priceSubscription: 57.19, // 12% off
  badge: "Multi-Action Formula",
  shortDescription: "5 clinically-studied ingredients with enhanced bioavailability. Glucosamine, Turmeric, Boswellia, Type II Collagen, and BioPerine\u00AE in one powerful formula.",
  fullDescription: "Laibar Joint Support is a premium multi-action formula designed for active adults who refuse to slow down. We combined five clinically-studied ingredients at their full therapeutic doses \u2014 no proprietary blends, no hidden amounts. Glucosamine sulfate (1500mg) rebuilds cartilage. Turmeric extract standardized to 95% curcuminoids targets inflammation. Boswellia serrata provides additional anti-inflammatory support through a complementary pathway. Type II Collagen supports cartilage structure and joint cushioning. And BioPerine\u00AE (black pepper extract) enhances absorption of curcumin by up to 2000%, ensuring your body actually uses what you take. Clean label: Non-GMO, no artificial colors or flavors, third-party tested for purity and potency. Made in the USA in an FDA-registered, GMP-certified facility.",
  ingredients: [
    { name: "Glucosamine Sulfate", amount: "1500mg", description: "Rebuilds cartilage & supports joint structure" },
    { name: "Turmeric Extract (95% Curcuminoids)", amount: "1000mg", description: "Clinically-standardized anti-inflammatory" },
    { name: "Boswellia Serrata Extract", amount: "600mg", description: "Complementary anti-inflammatory pathway" },
    { name: "Type II Collagen", amount: "500mg", description: "Supports cartilage integrity & cushioning" },
    { name: "BioPerine\u00AE (Black Pepper Extract)", amount: "10mg", description: "Enhances curcumin absorption by up to 2000%" }
  ],
  dosage: "Take 2 capsules daily with food and water for optimal absorption.",
  servings: 60,
  supplyDays: 30,
  rating: 4.8,
  reviewCount: 1247,
  image: "images/bottle-front.png",
  gradient: "linear-gradient(135deg, #1a1a1a 0%, #2a2520 40%, #1a1510 100%)",
  reviews: [
    { author: "Marcus T.", rating: 5, text: "I'm 42 and train 5x a week. This is the first joint supplement that actually keeps up with my lifestyle. Felt a real difference in my knees by week three.", date: "2026-02-15" },
    { author: "Sarah K.", rating: 5, text: "Love the transparent labeling \u2014 I can see exactly what I'm taking and at what dose. No proprietary blend nonsense. My morning runs feel smoother.", date: "2026-01-28" },
    { author: "James W.", rating: 5, text: "Switched from a big-name brand and the difference is night and day. The BioPerine for absorption is a game changer. Quality product.", date: "2026-02-08" },
    { author: "Andrea L.", rating: 4, text: "Takes a couple weeks to fully kick in, but once it does \u2014 wow. My yoga practice has never felt better. Clean ingredients, no stomach issues.", date: "2026-01-10" },
    { author: "David R.", rating: 5, text: "Finally a supplement brand that doesn't treat joint health like it's only for seniors. Modern brand, serious formula. Highly recommend.", date: "2026-02-20" },
    { author: "Michelle P.", rating: 5, text: "The multi-action approach makes so much sense. One bottle covers what used to take me three separate supplements. And it actually works.", date: "2025-12-30" }
  ]
};

const PRODUCTS = [PRODUCT];

// --- Purchase Mode ---
let purchaseMode = 'onetime'; // 'onetime' or 'subscription'

function getCurrentPrice() {
  return purchaseMode === 'subscription' ? PRODUCT.priceSubscription : PRODUCT.priceOneTime;
}

// --- Cart Module ---
const CART_KEY = 'laibar_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getCartMode() {
  return localStorage.getItem('laibar_cart_mode') || 'onetime';
}

function saveCartMode(mode) {
  localStorage.setItem('laibar_cart_mode', mode);
}

function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 10);
  } else {
    cart.push({ productId, quantity: Math.min(quantity, 10) });
  }
  saveCart(cart);
  saveCartMode(purchaseMode);
  updateCartBadge();
  showToast('Added to cart', 'success');
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.productId !== productId);
  saveCart(cart);
  updateCartBadge();
}

function updateQuantity(productId, newQuantity) {
  if (newQuantity <= 0) { removeFromCart(productId); return; }
  const cart = getCart();
  const item = cart.find(item => item.productId === productId);
  if (item) {
    item.quantity = Math.min(newQuantity, 10);
    saveCart(cart);
    updateCartBadge();
  }
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal() {
  const mode = getCartMode();
  const price = mode === 'subscription' ? PRODUCT.priceSubscription : PRODUCT.priceOneTime;
  return getCart().reduce((sum, item) => sum + (price * item.quantity), 0);
}

function getShippingCost(subtotal) {
  return subtotal >= 75 ? 0 : 5.99;
}

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = getCartCount();
  badges.forEach(badge => {
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  });
}

// --- Stripe Checkout ---
async function initiateStripeCheckout() {
  const cart = getCart();
  if (cart.length === 0) return;

  const mode = getCartMode();
  const price = mode === 'subscription' ? PRODUCT.priceSubscription : PRODUCT.priceOneTime;

  const items = cart.map(item => ({
    name: PRODUCT.name + (mode === 'subscription' ? ' (Subscribe & Save)' : ''),
    description: PRODUCT.tagline,
    price: price,
    quantity: item.quantity,
  }));

  // Set loading state on checkout buttons
  document.querySelectorAll('.btn-checkout').forEach(btn => {
    btn.classList.add('btn-loading');
    btn.disabled = true;
  });

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        mode: mode === 'subscription' ? 'subscription' : 'payment',
      }),
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Failed to create checkout session');
    }
  } catch (err) {
    console.error('Checkout error:', err);
    showToast('Checkout error. Please try again.', 'error');
    document.querySelectorAll('.btn-checkout').forEach(btn => {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    });
  }
}

// --- Toast Notifications ---
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- Scroll Animations ---
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// --- Navigation ---
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });
  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => links.classList.remove('open'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') links.classList.remove('open');
  });
}

// --- Announcement Bar ---
function initAnnouncementBar() {
  const bar = document.getElementById('announcement-bar');
  if (!bar) return;
  if (sessionStorage.getItem('announcement-dismissed')) {
    bar.remove();
    return;
  }
  bar.classList.add('visible');
  const closeBtn = bar.querySelector('.announcement-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      bar.classList.remove('visible');
      sessionStorage.setItem('announcement-dismissed', '1');
      setTimeout(() => bar.remove(), 300);
    });
  }
}

// --- Exit Intent Popup ---
function initExitIntent() {
  if (sessionStorage.getItem('exit-intent-shown')) return;
  if (localStorage.getItem('laibar_subscribed')) return;

  let triggered = false;

  document.addEventListener('mouseout', (e) => {
    if (triggered) return;
    if (e.clientY <= 0 && e.relatedTarget === null) {
      triggered = true;
      sessionStorage.setItem('exit-intent-shown', '1');
      showExitPopup();
    }
  });
}

function showExitPopup() {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.innerHTML = `
    <div class="popup-content">
      <button class="popup-close" aria-label="Close">&times;</button>
      <h2>Wait \u2014 don't leave empty-handed</h2>
      <p>Get <strong style="color:var(--gold)">10% off</strong> your first order.</p>
      <form class="popup-form" id="exit-intent-form">
        <input type="email" placeholder="Enter your email" required>
        <button type="submit" class="btn btn-primary btn-full">Get My 10% Off</button>
      </form>
      <p class="popup-note">No spam. Unsubscribe anytime.</p>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  overlay.querySelector('.popup-close').addEventListener('click', () => closePopup(overlay));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(overlay); });

  const form = overlay.querySelector('#exit-intent-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('input').value;
    const btn = form.querySelector('button');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      // Subscribe to newsletter
      await fetch('/api/newsletter-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Send welcome email with discount code
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, type: 'welcome', data: {} }),
      });

      localStorage.setItem('laibar_subscribed', '1');
      form.innerHTML = '<p style="color:var(--gold);font-weight:600;text-align:center;padding:1rem 0">Check your inbox for your 10% off code!</p>';
      setTimeout(() => closePopup(overlay), 2500);
    } catch {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      showToast('Something went wrong. Please try again.', 'error');
    }
  });
}

function closePopup(overlay) {
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 300);
}

// --- Star Rating Helper ---
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + '\u2606'.repeat(empty);
}

// --- Subscribe Toggle ---
function initSubscribeToggle() {
  const toggle = document.getElementById('purchase-toggle');
  if (!toggle) return;

  const onetimeBtn = toggle.querySelector('[data-mode="onetime"]');
  const subscribeBtn = toggle.querySelector('[data-mode="subscription"]');
  const priceDisplay = document.getElementById('detail-price') || document.querySelector('.showcase-price');
  const saveBadge = document.getElementById('save-badge');

  function updateMode(mode) {
    purchaseMode = mode;
    toggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    toggle.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    const price = getCurrentPrice();
    if (priceDisplay) {
      if (mode === 'subscription') {
        priceDisplay.innerHTML = `$${price.toFixed(2)}<span class="price-interval">/month</span>`;
      } else {
        priceDisplay.textContent = `$${price.toFixed(2)}`;
      }
    }
    if (saveBadge) {
      saveBadge.classList.toggle('visible', mode === 'subscription');
    }
  }

  if (onetimeBtn) onetimeBtn.addEventListener('click', () => updateMode('onetime'));
  if (subscribeBtn) subscribeBtn.addEventListener('click', () => updateMode('subscription'));

  updateMode('onetime');
}

// --- Home Page ---
function initHomePage() {
  const addBtn = document.getElementById('home-add-to-cart');
  if (addBtn) {
    addBtn.addEventListener('click', () => addToCart(PRODUCT.id));
  }
  initSubscribeToggle();
}

// --- Product Detail ---
function initProductDetail() {
  const breadcrumb = document.getElementById('detail-breadcrumb');
  if (breadcrumb) breadcrumb.innerHTML = `<a href="index.html">Home</a> &rsaquo; ${PRODUCT.name}`;

  const detailImage = document.getElementById('detail-image');
  if (PRODUCT.image) {
    detailImage.classList.add('has-image');
    detailImage.style.background = PRODUCT.gradient;
    detailImage.innerHTML = `<img src="${PRODUCT.image}" alt="${PRODUCT.name}" style="width:100%;height:100%;object-fit:contain;padding:1.5rem;">`;
  } else {
    detailImage.style.background = PRODUCT.gradient;
  }
  const badgeEl = document.getElementById('detail-badge');
  if (badgeEl) { badgeEl.textContent = PRODUCT.badge; badgeEl.style.display = 'inline-block'; }
  document.getElementById('detail-name').textContent = PRODUCT.name;
  document.getElementById('detail-tagline').textContent = PRODUCT.tagline;
  document.getElementById('detail-price').textContent = `$${PRODUCT.priceOneTime.toFixed(2)}`;
  document.getElementById('detail-rating').innerHTML = `${renderStars(PRODUCT.rating)} <span class="review-count">(${PRODUCT.reviewCount} reviews)</span>`;
  document.getElementById('detail-meta').textContent = `${PRODUCT.servings} capsules | ${PRODUCT.supplyDays}-day supply`;

  // Description tab
  document.getElementById('tab-description').innerHTML = `<p>${PRODUCT.fullDescription}</p><p style="margin-top:1rem"><strong style="color:var(--gold)">Dosage:</strong> ${PRODUCT.dosage}</p>`;

  // Ingredients tab
  let ingredientsHTML = '<table class="ingredients-table"><thead><tr><th>Ingredient</th><th>Amount Per Serving</th></tr></thead><tbody>';
  PRODUCT.ingredients.forEach(ing => {
    ingredientsHTML += `<tr><td>${ing.name}</td><td>${ing.amount}</td></tr>`;
  });
  ingredientsHTML += '</tbody></table>';
  document.getElementById('tab-ingredients').innerHTML = ingredientsHTML;

  // Reviews tab
  document.getElementById('tab-reviews').innerHTML = PRODUCT.reviews.map(r => `
    <div class="review-item">
      <div class="review-stars">${renderStars(r.rating)}</div>
      <div class="review-header">
        <span class="review-author">${r.author}</span>
        <span class="review-date">${new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <p class="review-text">${r.text}</p>
    </div>
  `).join('');

  // Quantity selector
  let qty = 1;
  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); qtyInput.value = qty; });
  document.getElementById('qty-plus').addEventListener('click', () => { qty = Math.min(10, qty + 1); qtyInput.value = qty; });
  qtyInput.addEventListener('change', () => { qty = Math.max(1, Math.min(10, parseInt(qtyInput.value) || 1)); qtyInput.value = qty; });

  // Add to cart
  document.getElementById('add-to-cart-btn').addEventListener('click', () => addToCart(PRODUCT.id, qty));

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Subscribe toggle
  initSubscribeToggle();
}

// --- Cart Page ---
function renderCartPage() {
  const content = document.getElementById('cart-content');
  if (!content) return;

  const cart = getCart();
  if (cart.length === 0) {
    content.innerHTML = `
      <div class="container">
        <div class="cart-empty">
          <p>Your cart is empty.</p>
          <a href="product-detail.html?id=1" class="btn btn-primary">Shop Now</a>
        </div>
      </div>`;
    return;
  }

  const mode = getCartMode();
  const price = mode === 'subscription' ? PRODUCT.priceSubscription : PRODUCT.priceOneTime;
  const modeLabel = mode === 'subscription' ? ' (Subscribe & Save)' : '';

  let itemsHTML = '';
  cart.forEach(item => {
    const lineTotal = price * item.quantity;
    itemsHTML += `
      <div class="cart-item" data-id="${PRODUCT.id}">
        <div class="cart-item-image">
          ${PRODUCT.image
            ? `<img src="${PRODUCT.image}" alt="${PRODUCT.name}" style="width:100%;height:100%;object-fit:contain;padding:0.25rem;">`
            : `<div class="product-gradient" style="background: ${PRODUCT.gradient}"></div>`}
        </div>
        <div class="cart-item-name">
          <h4>${PRODUCT.name}${modeLabel}</h4>
          <p>$${price.toFixed(2)} each</p>
        </div>
        <div class="cart-item-quantity">
          <div class="quantity-selector">
            <button class="qty-btn cart-qty-minus" data-id="${PRODUCT.id}">\u2212</button>
            <input type="number" class="qty-input cart-qty-input" data-id="${PRODUCT.id}" value="${item.quantity}" min="1" max="10">
            <button class="qty-btn cart-qty-plus" data-id="${PRODUCT.id}">+</button>
          </div>
        </div>
        <span class="cart-item-price">$${price.toFixed(2)}</span>
        <span class="cart-item-total">$${lineTotal.toFixed(2)}</span>
        <button class="cart-remove" data-id="${PRODUCT.id}" title="Remove">&times;</button>
      </div>`;
  });

  const subtotal = getCartTotal();
  const shipping = getShippingCost(subtotal);
  const total = subtotal + shipping;

  content.innerHTML = `
    <div class="container">
      <div class="cart-layout">
        <div class="cart-items">
          ${itemsHTML}
          ${mode === 'subscription' ? '<p class="cart-mode-note"><span class="gold-text">Subscribe & Save</span> \u2014 12% off, delivered monthly. Cancel anytime.</p>' : ''}
        </div>
        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div class="summary-line"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
          <div class="summary-line"><span>Shipping</span><span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span></div>
          <div class="summary-line summary-total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
          ${subtotal < 75 && shipping > 0 ? `<p class="free-shipping-note">Add $${(75 - subtotal).toFixed(2)} more for free shipping</p>` : '<p class="free-shipping-note">You qualify for free shipping!</p>'}
          <button class="btn btn-primary btn-lg btn-full btn-checkout" onclick="initiateStripeCheckout()">
            <span class="btn-text">Proceed to Checkout</span>
            <span class="btn-spinner"></span>
          </button>
          <a href="product-detail.html?id=1" class="cart-continue">&larr; Continue Shopping</a>
          <div class="cart-trust">
            <span>&#x1F512; Secure checkout powered by Stripe</span>
          </div>
        </div>
      </div>
    </div>`;

  // Attach cart event listeners
  content.querySelectorAll('.cart-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = getCart().find(i => i.productId === id);
      if (item) { updateQuantity(id, item.quantity - 1); renderCartPage(); }
    });
  });
  content.querySelectorAll('.cart-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = getCart().find(i => i.productId === id);
      if (item) { updateQuantity(id, item.quantity + 1); renderCartPage(); }
    });
  });
  content.querySelectorAll('.cart-qty-input').forEach(input => {
    input.addEventListener('change', () => {
      updateQuantity(parseInt(input.dataset.id), parseInt(input.value) || 1);
      renderCartPage();
    });
  });
  content.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(parseInt(btn.dataset.id));
      renderCartPage();
    });
  });
}

// --- Order Success Page ---
async function initOrderSuccess() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const content = document.getElementById('order-success-content');

  if (!content) return;

  // Clear cart immediately
  saveCart([]);
  updateCartBadge();

  if (!sessionId) {
    content.innerHTML = `
      <div class="order-confirmation">
        <div class="confirmation-icon">\u2713</div>
        <h2>Thank You!</h2>
        <p>Your order has been placed successfully.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:1.5rem">Return Home</a>
      </div>`;
    return;
  }

  // Show loading
  content.innerHTML = `
    <div class="order-confirmation">
      <div class="btn-spinner" style="margin:2rem auto;width:40px;height:40px;border-width:3px"></div>
      <p>Loading your order details...</p>
    </div>`;

  try {
    const res = await fetch(`/api/get-order?session_id=${sessionId}`);
    const order = await res.json();

    if (!res.ok) throw new Error(order.error);

    const itemsHtml = order.items ? order.items.map(item =>
      `<div class="order-item"><span>${item.name} &times;${item.quantity}</span><span>$${item.amount.toFixed(2)}</span></div>`
    ).join('') : '';

    const shippingHtml = order.shipping ? `
      <div class="order-section">
        <h4>Shipping To</h4>
        <p>${order.shipping.name}<br>
        ${order.shipping.address.line1}<br>
        ${order.shipping.address.line2 ? order.shipping.address.line2 + '<br>' : ''}
        ${order.shipping.address.city}, ${order.shipping.address.state} ${order.shipping.address.postal_code}</p>
      </div>` : '';

    content.innerHTML = `
      <div class="order-confirmation">
        <div class="confirmation-icon">\u2713</div>
        <h2>Order Confirmed!</h2>
        <p class="order-number">Order #${order.orderId}</p>
        ${order.email ? `<p>Confirmation sent to <strong>${order.email}</strong></p>` : ''}

        <div class="order-details-card">
          <h4>Order Details</h4>
          <div class="order-items">${itemsHtml}</div>
          <div class="order-total">
            <span>Total</span>
            <span>$${order.amount.toFixed(2)}</span>
          </div>
        </div>

        ${shippingHtml}

        <div class="order-section">
          <h4>What's Next</h4>
          <p>Estimated delivery: <strong>7\u201310 business days</strong>. We'll email you tracking information when your order ships.</p>
        </div>

        <a href="index.html" class="btn btn-primary" style="margin-top:1.5rem">Continue Shopping</a>
      </div>`;
  } catch (err) {
    console.error('Error fetching order:', err);
    content.innerHTML = `
      <div class="order-confirmation">
        <div class="confirmation-icon">\u2713</div>
        <h2>Thank You!</h2>
        <p>Your order has been placed successfully. You'll receive a confirmation email shortly.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:1.5rem">Return Home</a>
      </div>`;
  }
}

// --- Contact Form (with email API) ---
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));

    const fields = [
      { id: 'contact-name', test: v => v.trim().length > 0, msg: 'Name is required' },
      { id: 'contact-email', test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Valid email is required' },
      { id: 'contact-message', test: v => v.trim().length > 0, msg: 'Message is required' }
    ];

    fields.forEach(field => {
      const input = document.getElementById(field.id);
      if (!input) return;
      if (!field.test(input.value)) {
        valid = false;
        const group = input.closest('.form-group');
        group.classList.add('has-error');
        const errorEl = group.querySelector('.form-error');
        if (errorEl) errorEl.textContent = field.msg;
      }
    });

    if (!valid) { showToast('Please fix the errors below', 'error'); return; }

    const btn = form.querySelector('button[type="submit"]');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: document.getElementById('contact-email').value,
          type: 'contact',
          data: {
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            subject: document.getElementById('contact-subject')?.value || 'General Inquiry',
            message: document.getElementById('contact-message').value,
          },
        }),
      });
    } catch { /* send email is best-effort */ }

    btn.classList.remove('btn-loading');
    btn.disabled = false;
    form.reset();
    showToast('Message sent! We\'ll be in touch within 24 hours.', 'success');
  });
}

// --- Newsletter Form (with API) ---
function initNewsletter() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const btn = form.querySelector('button');

      if (!input || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        showToast('Please enter a valid email.', 'error');
        return;
      }

      btn.classList.add('btn-loading');
      btn.disabled = true;

      try {
        await fetch('/api/newsletter-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: input.value }),
        });
        localStorage.setItem('laibar_subscribed', '1');
        input.value = '';
        showToast('Thanks for subscribing!', 'success');
      } catch {
        showToast('Something went wrong. Please try again.', 'error');
      }

      btn.classList.remove('btn-loading');
      btn.disabled = false;
    });
  });
}

// --- Page Initializer ---
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  updateCartBadge();
  initScrollAnimations();
  initNewsletter();
  initAnnouncementBar();
  initExitIntent();

  const page = document.body.dataset.page;
  switch (page) {
    case 'home': initHomePage(); break;
    case 'product-detail': initProductDetail(); break;
    case 'cart': renderCartPage(); break;
    case 'order-success': initOrderSuccess(); break;
    case 'contact': initContactForm(); break;
  }
});
