const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Creates a Stripe Customer Portal session for subscription management.
 * Customers can update payment methods, cancel subscriptions, view invoices.
 *
 * POST /api/customer-portal
 * Body: { email: "customer@example.com" }
 * Returns: { url: "https://billing.stripe.com/..." }
 *
 * Prerequisites:
 * 1. Enable Customer Portal in Stripe Dashboard > Settings > Customer portal
 * 2. Configure allowed actions (cancel, update payment, view invoices)
 */
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method not allowed" });
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return respond(400, { error: "Email is required" });
    }

    // Find the Stripe customer by email
    const customers = await stripe.customers.list({
      email: email.toLowerCase().trim(),
      limit: 1,
    });

    if (customers.data.length === 0) {
      return respond(404, {
        error: "No account found with that email. Please use the email from your order.",
      });
    }

    const customer = customers.data[0];
    const siteUrl = process.env.URL || "https://laibarwellness.com";

    // Create a portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${siteUrl}/product-detail.html?id=1`,
    });

    return respond(200, { url: portalSession.url });
  } catch (err) {
    console.error("Customer portal error:", err);
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
