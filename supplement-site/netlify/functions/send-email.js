const { Resend } = require("resend");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set — skipping email");
    return respond(200, { success: true, message: "Email skipped (no API key)" });
  }

  try {
    const body = JSON.parse(event.body);
    const { subject, type } = body;
    // Support both { to, data } format and flat { email, name, message } format
    const to = body.to || body.email;
    const data = body.data || body;

    if (!type) {
      return respond(400, { error: "Missing required field: type" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    let html;
    let emailSubject = subject;

    switch (type) {
      case "contact":
        emailSubject = `Contact Form: ${data.subject || "General Inquiry"}`;
        html = buildContactEmail(data);
        // Send to support
        await resend.emails.send({
          from: "Laibar Wellness <noreply@laibarwellness.com>",
          to: "support@laibarwellness.com",
          replyTo: to,
          subject: emailSubject,
          html,
        });
        break;

      case "welcome":
        emailSubject = "Welcome to Laibar Wellness";
        html = buildWelcomeEmail(data);
        await resend.emails.send({
          from: "Laibar Wellness <hello@laibarwellness.com>",
          to,
          subject: emailSubject,
          html,
        });
        break;

      case "review":
        emailSubject = `New ${data.rating}-Star Review from ${escapeHtml(data.name)}`;
        html = buildReviewNotificationEmail(data);
        await resend.emails.send({
          from: "Laibar Wellness <noreply@laibarwellness.com>",
          to: "support@laibarwellness.com",
          replyTo: to,
          subject: emailSubject,
          html,
        });
        break;

      default:
        return respond(400, { error: "Unknown email type" });
    }

    return respond(200, { success: true });
  } catch (err) {
    console.error("Email error:", err);
    return respond(500, { error: err.message });
  }
};

function buildContactEmail(data) {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2>New Contact Form Submission</h2>
  <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
  <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
  <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
  <p><strong>Message:</strong></p>
  <p>${escapeHtml(data.message)}</p>
</div>`;
}

function buildWelcomeEmail(data) {
  return `
<div style="background:#0a0a0a;font-family:Arial,sans-serif;color:#f0ece4;padding:40px 20px">
  <div style="max-width:600px;margin:0 auto;text-align:center">
    <h1 style="color:#c8a55a;letter-spacing:3px;font-size:24px">LAIBAR</h1>
    <p style="color:#6b6760;letter-spacing:4px;font-size:10px;text-transform:uppercase">Wellness</p>
    <div style="background:#141414;border:1px solid rgba(200,165,90,0.12);border-radius:8px;padding:32px;margin:24px 0">
      <h2 style="color:#f0ece4;margin:0 0 16px">Welcome, ${escapeHtml(data.name || "there")}!</h2>
      <p style="color:#a8a49c;line-height:1.6">Thanks for your interest in Laibar Wellness. Here's your exclusive 10% off code for your first order:</p>
      <div style="background:rgba(200,165,90,0.1);border:1px solid rgba(200,165,90,0.3);border-radius:8px;padding:16px;margin:24px 0">
        <p style="color:#c8a55a;font-size:24px;font-weight:700;letter-spacing:2px;margin:0">WELCOME10</p>
      </div>
      <a href="${process.env.URL || "https://laibarwellness.com"}/product-detail.html?id=1" style="display:inline-block;background:#c8a55a;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600">Shop Now</a>
    </div>
  </div>
</div>`;
}

function buildReviewNotificationEmail(data) {
  const stars = "★".repeat(data.rating || 0) + "☆".repeat(5 - (data.rating || 0));
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0a0a;color:#f0ece4">
  <h2 style="color:#c8a55a">New Customer Review</h2>
  <div style="background:#141414;border:1px solid rgba(200,165,90,0.12);border-radius:8px;padding:24px;margin:16px 0">
    <p style="color:#c8a55a;font-size:1.5rem;margin:0 0 8px">${stars}</p>
    <p><strong>From:</strong> ${escapeHtml(data.name)} (${escapeHtml(data.email)})</p>
    <p><strong>Rating:</strong> ${data.rating}/5</p>
    <p><strong>Review:</strong></p>
    <p style="color:#a8a49c;line-height:1.6;font-style:italic">"${escapeHtml(data.message)}"</p>
  </div>
  <p style="color:#6b6760;font-size:12px">This review was submitted on the product page. To add it permanently, update the reviews in main.js.</p>
</div>`;
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
