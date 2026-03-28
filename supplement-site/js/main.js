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
  shortDescription: "12 active ingredients in one powerful formula. Turmeric Complex 900mg, Collagen, Glucosamine, Chondroitin, Hyaluronic Acid, Boswellia, MSM, Bromelain & more for complete joint support.",
  fullDescription: "Laibar Joint Support is a premium multi-action formula designed for active adults who refuse to slow down. Our comprehensive 12-ingredient blend targets joint health from every angle \u2014 no proprietary blends, no hidden amounts. A powerful 900mg Turmeric Complex with 95% curcuminoids leads the formula for anti-inflammatory support. Hydrolyzed Collagen Type II (100mg) and Chondroitin Sulfate (100mg) rebuild cartilage structure. Glucosamine Sulfate (100mg) and Hyaluronic Acid (100mg) support lubrication and cushioning. Boswellia Serrata (80mg) provides complementary anti-inflammatory support through a separate pathway. Vitamin C (60mg) aids collagen synthesis. Ginger Root (50mg) adds natural anti-inflammatory benefits. MSM (25mg) and Bromelain (25mg, 2500 GDU/g) further support recovery and comfort. Black Pepper Extract (5mg) enhances curcumin absorption so your body actually uses what you take. Clean label: Non-GMO, no artificial colors or flavors, third-party tested for purity and potency. Made in the USA in an FDA-registered, GMP-certified facility.",
  ingredients: [
    { name: "Vitamin C (as Ascorbic Acid)", amount: "60mg", description: "Supports collagen synthesis & antioxidant protection" },
    { name: "Turmeric Complex Extract Blend", amount: "900mg", description: "Turmeric Root Extract + Standardized 95% Curcuminoids" },
    { name: "Hydrolyzed Collagen Type II Extract", amount: "100mg", description: "Supports cartilage structure & joint cushioning" },
    { name: "Chondroitin Sulfate Extract", amount: "100mg", description: "Rebuilds cartilage & supports joint flexibility" },
    { name: "Glucosamine Sulfate Extract", amount: "100mg", description: "Supports joint structure & cartilage repair" },
    { name: "Hyaluronic Acid Extract", amount: "100mg", description: "Lubricates joints & supports synovial fluid" },
    { name: "Boswellia Serrata Resin Extract", amount: "80mg", description: "Anti-inflammatory via 5-LOX enzyme pathway" },
    { name: "Ginger Root Extract", amount: "50mg", description: "Natural anti-inflammatory & digestive support" },
    { name: "MSM (Methylsulfonylmethane) Extract", amount: "25mg", description: "Supports joint recovery & reduces oxidative stress" },
    { name: "Bromelain Fruit Extract (2,500 GDU/g)", amount: "25mg", description: "Enzyme support for inflammation & tissue repair" },
    { name: "Black Pepper Fruit Extract (Piperine)", amount: "5mg", description: "Enhances curcumin absorption & nutrient bioavailability" }
  ],
  dosage: "Take two (2) capsules per day. Do not exceed recommended dose.",
  servings: 60,
  supplyDays: 30,
  rating: 4.8,
  reviewCount: 1247,
  image: "images/bottle-front.png",
  gradient: "linear-gradient(135deg, #1a1a1a 0%, #2a2520 40%, #1a1510 100%)",
  reviews: [
    { author: "Marcus T.", rating: 5, text: "I'm 42 and train 5x a week. This is the first joint supplement that actually keeps up with my lifestyle. Felt a real difference in my knees by week three.", date: "2026-02-15" },
    { author: "Sarah K.", rating: 5, text: "Love the transparent labeling \u2014 I can see exactly what I'm taking and at what dose. No proprietary blend nonsense. My morning runs feel smoother.", date: "2026-01-28" },
    { author: "James W.", rating: 5, text: "Switched from a big-name brand and the difference is night and day. The turmeric complex with black pepper for absorption is a game changer. Quality product.", date: "2026-02-08" },
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

  // Pixel tracking — AddToCart event
  const price = getCurrentPrice();
  if (typeof fbq === 'function') fbq('track', 'AddToCart', { content_name: PRODUCT.name, content_ids: [productId], content_type: 'product', value: price * quantity, currency: 'USD' });
  if (typeof gtag === 'function') gtag('event', 'add_to_cart', { currency: 'USD', value: price * quantity, items: [{ item_id: productId, item_name: PRODUCT.name, price: price, quantity: quantity }] });
  if (typeof ttq === 'object') ttq.track('AddToCart', { content_id: productId, content_name: PRODUCT.name, quantity: quantity, price: price, value: price * quantity, currency: 'USD' });
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

  // Determine bundle size from cart quantity
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  let bundleSize = 1;
  if (totalQty >= 6) bundleSize = 6;
  else if (totalQty >= 3) bundleSize = 3;

  const items = cart.map(item => ({
    name: PRODUCT.name + (mode === 'subscription' ? ' (Subscribe & Save)' : ''),
    description: PRODUCT.tagline,
    price: price,
    quantity: item.quantity,
  }));

  // Pixel tracking — InitiateCheckout event
  const totalValue = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  if (typeof fbq === 'function') fbq('track', 'InitiateCheckout', { value: totalValue, currency: 'USD', num_items: items.length });
  if (typeof gtag === 'function') gtag('event', 'begin_checkout', { currency: 'USD', value: totalValue, items: items.map(i => ({ item_name: i.name, price: i.price, quantity: i.quantity })) });
  if (typeof ttq === 'object') ttq.track('InitiateCheckout', { value: totalValue, currency: 'USD' });

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
        bundleSize,
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

// --- Customer Portal (Subscription Management) ---
async function openCustomerPortal(e) {
  e.preventDefault();
  const email = prompt('Enter the email address associated with your subscription:');
  if (!email) return;

  showToast('Loading subscription portal...', 'success');

  try {
    const response = await fetch('/api/customer-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast(data.error || 'Could not find your subscription.', 'error');
    }
  } catch (err) {
    showToast('Something went wrong. Please try again.', 'error');
  }
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

// --- Joint Health Quiz Popup ---
function initEmailPopup() {
  if (sessionStorage.getItem('email-popup-shown')) return;
  if (localStorage.getItem('laibar_subscribed')) return;

  const overlay = document.getElementById('email-popup-overlay');
  if (!overlay) return;

  let triggered = false;
  let quizAnswers = [];

  function showPopup() {
    if (triggered) return;
    triggered = true;
    sessionStorage.setItem('email-popup-shown', '1');
    overlay.classList.add('active');
  }

  function hidePopup() {
    overlay.classList.remove('active');
  }

  // Exit intent (desktop)
  document.addEventListener('mouseout', (e) => {
    if (e.clientY <= 0 && e.relatedTarget === null) showPopup();
  });

  // Timed fallback — show after 8 seconds
  setTimeout(showPopup, 8000);

  // Close handler
  const closeBtn = document.getElementById('email-popup-close');
  if (closeBtn) closeBtn.addEventListener('click', hidePopup);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) hidePopup(); });

  // Navigate to step
  function goToStep(stepNum) {
    overlay.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    const target = overlay.querySelector(`.quiz-step[data-step="${stepNum}"]`);
    if (target) target.classList.add('active');
  }

  // Intro "Get My Discount" button
  const nextBtn = overlay.querySelector('.quiz-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => goToStep(parseInt(nextBtn.dataset.next)));
  }

  // Quiz option clicks — auto-advance
  overlay.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const step = opt.closest('.quiz-step');
      const stepNum = parseInt(step.dataset.step);

      // Highlight selected
      step.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');

      // Store answer
      quizAnswers[stepNum - 1] = parseInt(opt.dataset.value);

      // Advance after brief delay
      setTimeout(() => {
        if (stepNum < 3) {
          goToStep(stepNum + 1);
        } else {
          showScore();
        }
      }, 300);
    });
  });

  // Calculate and show score
  function showScore() {
    const total = quizAnswers.reduce((a, b) => a + b, 0); // 3-9
    // Higher total = worse joints = higher discount
    // Score: inverse — 9 max issues → low score
    const score = Math.max(10, Math.round(100 - ((total - 3) / 6) * 75));

    let discount, code, title, desc;
    if (score >= 75) {
      discount = 10; code = 'JOINT10';
      title = 'Looking Good!';
      desc = 'Your joints are in decent shape. Laibar can help you stay ahead and keep moving freely.';
    } else if (score >= 45) {
      discount = 20; code = 'JOINT20';
      title = 'Room for Improvement';
      desc = 'Your joints could use some support. Laibar\'s 12-ingredient formula targets exactly the areas you\'re struggling with.';
    } else {
      discount = 25; code = 'JOINT25';
      title = 'Time to Take Action';
      desc = 'Your joints need serious support. The good news? Laibar was built for exactly this — and we\'re giving you our biggest discount.';
    }

    goToStep(4);

    // Animate score number
    const scoreEl = document.getElementById('quiz-score-number');
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= score) { current = score; clearInterval(interval); }
      scoreEl.textContent = current;
    }, 20);

    document.getElementById('quiz-score-title').textContent = title;
    document.getElementById('quiz-score-desc').textContent = desc;
    document.getElementById('quiz-discount-text').innerHTML = `You unlocked <strong>${discount}% OFF</strong> — use code <strong>${code}</strong>`;
  }

  // Form submit
  const form = document.getElementById('email-popup-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const btn = form.querySelector('button');
      btn.classList.add('btn-loading');
      btn.disabled = true;

      try {
        await fetch('/api/newsletter-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: input.value }),
        });
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: input.value, type: 'welcome', data: {} }),
        });

        localStorage.setItem('laibar_subscribed', '1');
        form.innerHTML = '<p style="color:var(--gold);font-weight:600;text-align:center;padding:1rem 0">Check your inbox for your discount code!</p>';
        setTimeout(hidePopup, 3000);
      } catch {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
        showToast('Something went wrong. Please try again.', 'error');
      }
    });
  }
}

// --- Product Image Gallery ---
function initProductGallery() {
  const thumbs = document.querySelectorAll('.gallery-thumb');
  const mainImg = document.getElementById('gallery-main-img');
  if (!thumbs.length || !mainImg) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = thumb.dataset.src;
        mainImg.alt = thumb.dataset.alt;
        mainImg.style.opacity = '1';
      }, 150);
    });
  });
}

// --- Sticky Mobile Add to Cart ---
function initStickyATC() {
  const sticky = document.getElementById('sticky-atc');
  if (!sticky) return;

  // Find the main CTA button to track visibility
  const heroBtn = document.querySelector('.hero .btn-primary') || document.querySelector('.showcase-info .btn-primary');
  if (!heroBtn) return;

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      sticky.style.transform = 'translateY(100%)';
    } else {
      sticky.style.transform = 'translateY(0)';
    }
  }, { threshold: 0 });

  sticky.style.transition = 'transform 0.3s ease';
  sticky.style.transform = 'translateY(100%)';
  observer.observe(heroBtn);
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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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

// --- Bundle Selector ---
let selectedBundle = { qty: 1, pricePerBottle: 64.99 };

function initBundleSelector() {
  const selector = document.getElementById('bundle-selector');
  if (!selector) return;

  const options = selector.querySelectorAll('.bundle-option');
  const priceDisplay = document.getElementById('showcase-price') || document.getElementById('detail-price') || document.querySelector('.showcase-price');

  options.forEach(option => {
    option.addEventListener('click', () => {
      const qty = parseInt(option.dataset.qty);
      const price = parseFloat(option.dataset.price);
      selectedBundle = { qty, pricePerBottle: price };
      updateBundlePrice();
    });
  });

  function updateBundlePrice() {
    const total = selectedBundle.qty * selectedBundle.pricePerBottle;
    const isSubscription = purchaseMode === 'subscription';
    const displayPrice = isSubscription ? (total * 0.88).toFixed(2) : total.toFixed(2);

    if (priceDisplay) {
      if (isSubscription) {
        priceDisplay.innerHTML = `$${displayPrice}<span class="price-interval">/month</span>`;
      } else {
        priceDisplay.textContent = `$${displayPrice}`;
      }
    }
  }

  // Override the subscribe toggle to also account for bundle pricing
  const toggle = document.getElementById('purchase-toggle');
  if (toggle) {
    toggle.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(updateBundlePrice, 10);
      });
    });
  }
}

// --- Showcase Gallery (Homepage) ---
function initShowcaseGallery() {
  const thumbs = document.querySelectorAll('.showcase-thumb');
  const mainImg = document.getElementById('showcase-main');
  if (!thumbs.length || !mainImg) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = thumb.dataset.src;
        mainImg.alt = thumb.dataset.alt;
        mainImg.style.opacity = '1';
      }, 150);
    });
  });
}

// --- Home Page ---
function initHomePage() {
  const addBtn = document.getElementById('home-add-to-cart');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      for (let i = 0; i < selectedBundle.qty; i++) {
        addToCart(PRODUCT.id);
      }
    });
  }
  initSubscribeToggle();
  initBundleSelector();
  initShowcaseGallery();
}

// --- Product Detail ---
function initProductDetail() {
  const breadcrumb = document.getElementById('detail-breadcrumb');
  if (breadcrumb) breadcrumb.innerHTML = `<a href="index.html">Home</a> &rsaquo; ${PRODUCT.name}`;

  // Gallery is now in HTML with showcase-image-gallery style
  const badgeEl = document.getElementById('detail-badge');
  if (badgeEl) { badgeEl.textContent = PRODUCT.badge; badgeEl.style.display = 'inline-block'; }
  document.getElementById('detail-name').textContent = PRODUCT.name;
  document.getElementById('detail-tagline').textContent = PRODUCT.tagline;
  document.getElementById('detail-price').textContent = `$${PRODUCT.priceOneTime.toFixed(2)}`;
  document.getElementById('detail-rating').innerHTML = `${renderStars(PRODUCT.rating)} <span class="review-count">(${PRODUCT.reviewCount} reviews)</span>`;
  document.getElementById('detail-meta').textContent = `${PRODUCT.servings} capsules | ${PRODUCT.supplyDays}-day supply`;

  // Init detail page gallery (same as showcase gallery but with detail IDs)
  const detailThumbs = document.querySelectorAll('#detail-thumbs .showcase-thumb');
  const detailMain = document.getElementById('detail-main');
  if (detailThumbs.length && detailMain) {
    detailThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        detailThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        detailMain.style.opacity = '0';
        setTimeout(() => {
          detailMain.src = thumb.dataset.src;
          detailMain.alt = thumb.dataset.alt;
          detailMain.style.opacity = '1';
        }, 150);
      });
    });
  }

  // Description tab — no supplement facts images here since they're in the gallery
  document.getElementById('tab-description').innerHTML = `<p>${PRODUCT.fullDescription}</p><p style="margin-top:1rem"><strong style="color:var(--gold)">Dosage:</strong> ${PRODUCT.dosage}</p><p class="fda-disclaimer" style="margin-top:1.5rem;font-size:0.75rem;color:var(--text-secondary);line-height:1.5;">* These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.</p>`;

  // Reviews tab — existing reviews + submission form
  const reviewsHTML = PRODUCT.reviews.map(r => `
    <div class="review-item">
      <div class="review-stars">${renderStars(r.rating)}</div>
      <div class="review-header">
        <span class="review-author">${r.author}</span>
        <span class="review-date">${new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <p class="review-text">${r.text}</p>
    </div>
  `).join('');

  // Load any user-submitted reviews from localStorage
  const savedReviews = JSON.parse(localStorage.getItem('laibar_user_reviews') || '[]');
  const userReviewsHTML = savedReviews.map(r => `
    <div class="review-item" style="border-left:3px solid var(--gold);padding-left:1rem;">
      <div class="review-stars">${renderStars(r.rating)}</div>
      <div class="review-header">
        <span class="review-author">${escapeHtml(r.name)}</span>
        <span class="review-date">${new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <p class="review-text">${escapeHtml(r.text)}</p>
    </div>
  `).join('');

  document.getElementById('tab-reviews').innerHTML = `
    ${reviewsHTML}
    ${userReviewsHTML}
    <div class="review-form-section" style="margin-top:2.5rem;padding-top:2rem;border-top:1px solid var(--border);">
      <h3 style="color:var(--gold);margin-bottom:1rem;">Write a Review</h3>
      <form id="review-form" class="review-form">
        <div style="display:flex;gap:1rem;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <label style="display:block;margin-bottom:0.25rem;font-size:0.85rem;color:var(--text-secondary);">Your Name</label>
            <input type="text" id="review-name" placeholder="First name & last initial" required style="width:100%;padding:0.75rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:0.95rem;">
          </div>
          <div style="flex:1;min-width:200px;">
            <label style="display:block;margin-bottom:0.25rem;font-size:0.85rem;color:var(--text-secondary);">Email (not published)</label>
            <input type="email" id="review-email" placeholder="your@email.com" required style="width:100%;padding:0.75rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:0.95rem;">
          </div>
        </div>
        <div style="margin-top:1rem;">
          <label style="display:block;margin-bottom:0.25rem;font-size:0.85rem;color:var(--text-secondary);">Rating</label>
          <div class="review-star-select" id="review-star-select" style="font-size:1.5rem;cursor:pointer;color:var(--text-muted);">
            <span data-star="1">\u2606</span><span data-star="2">\u2606</span><span data-star="3">\u2606</span><span data-star="4">\u2606</span><span data-star="5">\u2606</span>
          </div>
          <input type="hidden" id="review-rating" value="0">
        </div>
        <div style="margin-top:1rem;">
          <label style="display:block;margin-bottom:0.25rem;font-size:0.85rem;color:var(--text-secondary);">Your Review</label>
          <textarea id="review-text" placeholder="How has Laibar Joint Support helped you?" required rows="4" style="width:100%;padding:0.75rem;background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:0.95rem;resize:vertical;"></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top:1rem;">Submit Review</button>
      </form>
    </div>
  `;

  // Star rating click handler
  const starSelect = document.getElementById('review-star-select');
  const ratingInput = document.getElementById('review-rating');
  if (starSelect) {
    starSelect.querySelectorAll('[data-star]').forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.star);
        ratingInput.value = val;
        starSelect.querySelectorAll('[data-star]').forEach(s => {
          s.textContent = parseInt(s.dataset.star) <= val ? '\u2605' : '\u2606';
          s.style.color = parseInt(s.dataset.star) <= val ? 'var(--gold)' : 'var(--text-muted)';
        });
      });
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.star);
        starSelect.querySelectorAll('[data-star]').forEach(s => {
          s.style.color = parseInt(s.dataset.star) <= val ? 'var(--gold)' : 'var(--text-muted)';
        });
      });
    });
    starSelect.addEventListener('mouseleave', () => {
      const current = parseInt(ratingInput.value);
      starSelect.querySelectorAll('[data-star]').forEach(s => {
        s.style.color = parseInt(s.dataset.star) <= current ? 'var(--gold)' : 'var(--text-muted)';
      });
    });
  }

  // Review form submission
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rating = parseInt(ratingInput.value);
      if (rating === 0) { showToast('Please select a star rating', 'error'); return; }

      const reviewData = {
        name: document.getElementById('review-name').value.trim(),
        email: document.getElementById('review-email').value.trim(),
        rating,
        text: document.getElementById('review-text').value.trim(),
        date: new Date().toISOString().split('T')[0],
      };

      // Save to localStorage
      const reviews = JSON.parse(localStorage.getItem('laibar_user_reviews') || '[]');
      reviews.push(reviewData);
      localStorage.setItem('laibar_user_reviews', JSON.stringify(reviews));

      // Send review via email notification
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'review',
            name: reviewData.name,
            email: reviewData.email,
            rating: reviewData.rating,
            message: reviewData.text,
          }),
        });
      } catch (err) { console.error('Review email error:', err); }

      showToast('Thank you for your review!', 'success');
      reviewForm.reset();
      ratingInput.value = '0';
      starSelect.querySelectorAll('[data-star]').forEach(s => { s.textContent = '\u2606'; s.style.color = 'var(--text-muted)'; });

      // Add the review to the page immediately
      const newReviewEl = document.createElement('div');
      newReviewEl.className = 'review-item';
      newReviewEl.style.borderLeft = '3px solid var(--gold)';
      newReviewEl.style.paddingLeft = '1rem';
      newReviewEl.innerHTML = `
        <div class="review-stars">${renderStars(reviewData.rating)}</div>
        <div class="review-header">
          <span class="review-author">${escapeHtml(reviewData.name)}</span>
          <span class="review-date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <p class="review-text">${escapeHtml(reviewData.text)}</p>
      `;
      document.querySelector('.review-form-section').insertAdjacentElement('beforebegin', newReviewEl);
    });
  }

  // Add to cart — uses bundle quantity
  document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    for (let i = 0; i < selectedBundle.qty; i++) {
      addToCart(PRODUCT.id);
    }
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Subscribe toggle & bundle selector
  initSubscribeToggle();
  initBundleSelector();
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
            ? `<picture><source srcset="${PRODUCT.image.replace(/\.(png|jpe?g)$/i, '.webp')}" type="image/webp"><img src="${PRODUCT.image}" alt="${PRODUCT.name}" style="width:100%;height:100%;object-fit:contain;padding:0.25rem;" loading="lazy"></picture>`
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
  initEmailPopup();
  initStickyATC();

  const page = document.body.dataset.page;
  switch (page) {
    case 'home': initHomePage(); break;
    case 'product-detail': initProductDetail(); initProductGallery(); break;
    case 'cart': renderCartPage(); break;
    case 'order-success': initOrderSuccess(); break;
    case 'contact': initContactForm(); break;
  }
});
