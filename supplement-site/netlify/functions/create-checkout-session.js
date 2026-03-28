const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method not allowed" });
  }

  try {
    const { items, mode, customerEmail, bundleSize } = JSON.parse(event.body);

    if (!items || !items.length) {
      return respond(400, { error: "No items provided" });
    }

    const isSubscription = mode === "subscription";
    const siteUrl = process.env.URL || "http://localhost:8888";

    // Resolve the correct Stripe Price ID based on bundle size
    const priceId = resolvePriceId(isSubscription, bundleSize || 1);

    // Build line items
    const lineItems = items.map((item) => {
      if (priceId) {
        // Use pre-created Stripe Price ID
        return {
          price: priceId,
          quantity: item.quantity,
        };
      }

      // Fallback: create price_data inline (one-time only)
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            description: item.description || "Premium Joint Support Supplement",
          },
          unit_amount: Math.round(item.price * 100), // cents
          ...(isSubscription && {
            recurring: { interval: "month" },
          }),
        },
        quantity: item.quantity,
      };
    });

    // Calculate if free shipping applies
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const qualifiesForFreeShipping = subtotal >= 75;

    // Build shipping options
    const shippingOptions = qualifiesForFreeShipping
      ? [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 0, currency: "usd" },
              display_name: "Free Shipping",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 5 },
                maximum: { unit: "business_day", value: 7 },
              },
            },
          },
        ]
      : [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 599, currency: "usd" },
              display_name: "Standard Shipping",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 5 },
                maximum: { unit: "business_day", value: 7 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 0, currency: "usd" },
              display_name: "Free Shipping (orders $75+)",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 5 },
                maximum: { unit: "business_day", value: 7 },
              },
            },
          },
        ];

    // Create Stripe Checkout Session
    const sessionConfig = {
      mode: isSubscription ? "subscription" : "payment",
      line_items: lineItems,
      success_url: `${siteUrl}/order-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart.html`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      ...(customerEmail && { customer_email: customerEmail }),
      ...(!isSubscription && {
        shipping_address_collection: {
          allowed_countries: ["US", "CA"],
        },
        shipping_options: shippingOptions,
      }),
      metadata: {
        source: "laibar-website",
        mode: isSubscription ? "subscription" : "one-time",
        bundleSize: String(bundleSize || 1),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return respond(200, { url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return respond(500, { error: err.message });
  }
};

/**
 * Resolve the correct Stripe Price ID based on subscription mode and bundle size.
 *
 * Environment variables to set in Netlify:
 *   STRIPE_PRICE_ONETIME        — 1 bottle one-time (fallback)
 *   STRIPE_PRICE_SUBSCRIPTION   — 1 bottle subscription (fallback)
 *   STRIPE_PRICE_1BOTTLE        — 1 bottle one-time
 *   STRIPE_PRICE_3BUNDLE        — 3 bottles one-time ($54.99/ea)
 *   STRIPE_PRICE_6BUNDLE        — 6 bottles one-time ($47.99/ea)
 *   STRIPE_PRICE_1BOTTLE_SUB    — 1 bottle subscription
 *   STRIPE_PRICE_3BUNDLE_SUB    — 3 bottles subscription
 *   STRIPE_PRICE_6BUNDLE_SUB    — 6 bottles subscription
 */
function resolvePriceId(isSubscription, bundleSize) {
  if (isSubscription) {
    if (bundleSize >= 6 && process.env.STRIPE_PRICE_6BUNDLE_SUB)
      return process.env.STRIPE_PRICE_6BUNDLE_SUB;
    if (bundleSize >= 3 && process.env.STRIPE_PRICE_3BUNDLE_SUB)
      return process.env.STRIPE_PRICE_3BUNDLE_SUB;
    if (process.env.STRIPE_PRICE_1BOTTLE_SUB)
      return process.env.STRIPE_PRICE_1BOTTLE_SUB;
    return process.env.STRIPE_PRICE_SUBSCRIPTION || null;
  }

  if (bundleSize >= 6 && process.env.STRIPE_PRICE_6BUNDLE)
    return process.env.STRIPE_PRICE_6BUNDLE;
  if (bundleSize >= 3 && process.env.STRIPE_PRICE_3BUNDLE)
    return process.env.STRIPE_PRICE_3BUNDLE;
  if (process.env.STRIPE_PRICE_1BOTTLE)
    return process.env.STRIPE_PRICE_1BOTTLE;
  return process.env.STRIPE_PRICE_ONETIME || null;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
