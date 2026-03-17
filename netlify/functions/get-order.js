const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "GET") {
    return respond(405, { error: "Method not allowed" });
  }

  try {
    const sessionId = event.queryStringParameters?.session_id;

    if (!sessionId) {
      return respond(400, { error: "session_id is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent", "customer_details"],
    });

    if (!session) {
      return respond(404, { error: "Session not found" });
    }

    const order = {
      orderId: (
        session.payment_intent?.id ||
        session.subscription ||
        session.id
      )
        .slice(-8)
        .toUpperCase(),
      email: session.customer_details?.email,
      name: session.customer_details?.name,
      amount: session.amount_total / 100,
      currency: session.currency,
      mode: session.mode,
      status: session.payment_status,
      items: session.line_items?.data.map((item) => ({
        name: item.description,
        quantity: item.quantity,
        amount: item.amount_total / 100,
      })),
      shipping: session.shipping_details
        ? {
            name: session.shipping_details.name,
            address: session.shipping_details.address,
          }
        : null,
    };

    return respond(200, order);
  } catch (err) {
    console.error("Get order error:", err);
    return respond(500, { error: err.message });
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
