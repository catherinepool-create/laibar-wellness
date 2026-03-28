const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Resend } = require("resend");
const { sendPostPurchaseSequence } = require("./post-purchase-emails");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const sig = event.headers["stripe-signature"];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(stripeEvent.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(stripeEvent.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionCancelled(stripeEvent.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }
  } catch (err) {
    console.error(`Error handling ${stripeEvent.type}:`, err);
    // Return 200 anyway so Stripe doesn't retry
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

async function handleCheckoutComplete(session) {
  console.log("Order completed:", session.id);
  console.log("Customer email:", session.customer_details?.email);
  console.log("Amount total:", session.amount_total);
  console.log("Payment status:", session.payment_status);

  // Retrieve full session with line items
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items", "customer_details"],
  });

  const order = {
    orderId: session.payment_intent || session.subscription || session.id,
    email: session.customer_details?.email,
    name: session.customer_details?.name,
    amount: session.amount_total / 100,
    currency: session.currency,
    mode: session.mode,
    items: fullSession.line_items?.data.map((item) => ({
      name: item.description,
      quantity: item.quantity,
      amount: item.amount_total / 100,
    })),
    shipping: session.shipping_details,
    createdAt: new Date().toISOString(),
  };

  console.log("Order data:", JSON.stringify(order, null, 2));

  // Send confirmation email
  if (resend && session.customer_details?.email) {
    await sendOrderConfirmation(order);
  }

  // Server-side Conversions API — Meta Pixel Purchase event
  if (process.env.META_PIXEL_ID && process.env.META_ACCESS_TOKEN) {
    await sendMetaConversionEvent(order, session);
  }

  // Post-purchase drip email sequence (Day 3, 14, 25, 30)
  try {
    await sendPostPurchaseSequence(order);
  } catch (err) {
    console.error("Post-purchase sequence error:", err);
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log("New subscription:", subscription.id);
  console.log("Customer:", subscription.customer);
  console.log("Status:", subscription.status);
}

async function handleSubscriptionCancelled(subscription) {
  console.log("Subscription cancelled:", subscription.id);
  console.log("Customer:", subscription.customer);
}

async function sendOrderConfirmation(order) {
  if (!resend) return;

  const itemsHtml = order.items
    ? order.items
        .map(
          (item) =>
            `<tr><td style="padding:8px 16px;border-bottom:1px solid #2a2a2a">${item.name}</td><td style="padding:8px 16px;border-bottom:1px solid #2a2a2a;text-align:right">x${item.quantity}</td><td style="padding:8px 16px;border-bottom:1px solid #2a2a2a;text-align:right">$${item.amount.toFixed(2)}</td></tr>`
        )
        .join("")
    : "";

  const shippingHtml = order.shipping
    ? `<p style="color:#a8a49c;margin:0">${order.shipping.name}<br>${order.shipping.address?.line1}<br>${order.shipping.address?.city}, ${order.shipping.address?.state} ${order.shipping.address?.postal_code}</p>`
    : "";

  try {
    await resend.emails.send({
      from: "Laibar Wellness <orders@laibarwellness.com>",
      to: order.email,
      subject: `Order Confirmed — ${order.orderId.slice(-8).toUpperCase()}`,
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f0ece4">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="font-size:24px;color:#c8a55a;letter-spacing:3px;margin:0">LAIBAR</h1>
      <p style="font-size:10px;color:#6b6760;letter-spacing:4px;text-transform:uppercase;margin:0">Wellness</p>
    </div>

    <div style="background:#141414;border:1px solid rgba(200,165,90,0.12);border-radius:8px;padding:32px;margin-bottom:24px">
      <h2 style="color:#f0ece4;font-size:20px;margin:0 0 8px">Thank you for your order!</h2>
      <p style="color:#a8a49c;margin:0 0 24px">Order #${order.orderId.slice(-8).toUpperCase()}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 16px;color:#c8a55a;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(200,165,90,0.2)">Item</th>
            <th style="text-align:right;padding:8px 16px;color:#c8a55a;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(200,165,90,0.2)">Qty</th>
            <th style="text-align:right;padding:8px 16px;color:#c8a55a;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(200,165,90,0.2)">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="text-align:right;border-top:1px solid rgba(200,165,90,0.2);padding-top:16px">
        <p style="color:#c8a55a;font-size:18px;font-weight:700;margin:0">Total: $${order.amount.toFixed(2)}</p>
      </div>
    </div>

    ${
      order.shipping
        ? `
    <div style="background:#141414;border:1px solid rgba(200,165,90,0.12);border-radius:8px;padding:24px;margin-bottom:24px">
      <h3 style="color:#c8a55a;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Shipping To</h3>
      ${shippingHtml}
      <p style="color:#6b6760;font-size:13px;margin:12px 0 0">Estimated delivery: 7-10 business days</p>
    </div>`
        : ""
    }

    <div style="background:#141414;border:1px solid rgba(200,165,90,0.12);border-radius:8px;padding:24px;margin-bottom:24px;text-align:center">
      <p style="color:#a8a49c;margin:0 0 4px">We'll email you tracking information when your order ships.</p>
      <p style="color:#6b6760;font-size:13px;margin:0">Questions? Reply to this email or contact support@laibarwellness.com</p>
    </div>

    <div style="text-align:center;padding:24px 0;border-top:1px solid rgba(200,165,90,0.12)">
      <p style="color:#6b6760;font-size:12px;margin:0">&copy; 2026 Laibar Wellness. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    });
    console.log("Confirmation email sent to:", order.email);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

/**
 * Meta Conversions API — server-side Purchase event
 * Much more reliable than browser pixels (no ad blockers, no page-close race conditions)
 *
 * Required env vars:
 *   META_PIXEL_ID      — Your Meta Pixel ID (same one used in the HTML snippet)
 *   META_ACCESS_TOKEN   — Generate in Meta Events Manager > Settings > Generate Access Token
 */
async function sendMetaConversionEvent(order, session) {
  try {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    const eventData = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: `${process.env.URL || "https://laibarwellness.com"}/order-success.html`,
          user_data: {
            em: order.email
              ? [require("crypto").createHash("sha256").update(order.email.toLowerCase().trim()).digest("hex")]
              : undefined,
            fn: order.name
              ? [require("crypto").createHash("sha256").update(order.name.split(" ")[0].toLowerCase().trim()).digest("hex")]
              : undefined,
            ln: order.name && order.name.split(" ").length > 1
              ? [require("crypto").createHash("sha256").update(order.name.split(" ").slice(-1)[0].toLowerCase().trim()).digest("hex")]
              : undefined,
            ct: session.shipping_details?.address?.city
              ? [require("crypto").createHash("sha256").update(session.shipping_details.address.city.toLowerCase().trim()).digest("hex")]
              : undefined,
            st: session.shipping_details?.address?.state
              ? [require("crypto").createHash("sha256").update(session.shipping_details.address.state.toLowerCase().trim()).digest("hex")]
              : undefined,
            zp: session.shipping_details?.address?.postal_code
              ? [require("crypto").createHash("sha256").update(session.shipping_details.address.postal_code.trim()).digest("hex")]
              : undefined,
            country: session.shipping_details?.address?.country
              ? [require("crypto").createHash("sha256").update(session.shipping_details.address.country.toLowerCase().trim()).digest("hex")]
              : undefined,
          },
          custom_data: {
            currency: order.currency?.toUpperCase() || "USD",
            value: order.amount,
            content_type: "product",
            contents: order.items
              ? order.items.map((item) => ({
                  id: "LAIBAR-JS-001",
                  quantity: item.quantity,
                  item_price: item.amount,
                }))
              : [{ id: "LAIBAR-JS-001", quantity: 1 }],
            order_id: order.orderId,
          },
        },
      ],
    };

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );

    const result = await response.json();
    console.log("Meta CAPI Purchase event sent:", JSON.stringify(result));
  } catch (err) {
    console.error("Meta CAPI error:", err);
    // Don't throw — purchase tracking failure shouldn't block order flow
  }
}
