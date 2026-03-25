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
    const { items, mode, customerEmail } = JSON.parse(event.body);

    if (!items || !items.length) {
      return respond(400, { error: "No items provided" });
    }

    const isSubscription = mode === "subscription";
    const siteUrl = process.env.URL || "http://localhost:8888";

    // Build line items
    const lineItems = items.map((item) => {
      if (isSubscription && process.env.STRIPE_PRICE_SUBSCRIPTION) {
        // Use pre-created Stripe Price for subscriptions
        return {
          price: process.env.STRIPE_PRICE_SUBSCRIPTION,
          quantity: item.quantity,
        };
      }

      if (!isSubscription && process.env.STRIPE_PRICE_ONETIME) {
        // Use pre-created Stripe Price for one-time
        return {
          price: process.env.STRIPE_PRICE_ONETIME,
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
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return respond(200, { url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return respond(500, { error: err.message });
  }
};

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
