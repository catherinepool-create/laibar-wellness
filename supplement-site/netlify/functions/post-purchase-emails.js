const { Resend } = require("resend");

/**
 * Post-Purchase Email Sequence
 * Called from stripe-webhook.js after checkout.session.completed
 *
 * Sends a timed drip sequence:
 *   Day 3:  "How to get the most from your supplement"
 *   Day 14: "How are you feeling?" check-in
 *   Day 25: "Time to reorder" with subscription upsell
 *   Day 30: Review request
 *
 * Uses Resend's scheduled sending (send_at parameter) to queue all emails at once.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.URL || "https://laibarwellness.com";

async function sendPostPurchaseSequence(order) {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set — skipping post-purchase sequence");
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  const email = order.email;
  const firstName = order.name ? order.name.split(" ")[0] : "there";

  if (!email) {
    console.log("No email for post-purchase sequence");
    return;
  }

  const now = new Date();

  // --- Day 3: Dosage Tips ---
  const day3 = new Date(now);
  day3.setDate(day3.getDate() + 3);
  day3.setHours(9, 0, 0, 0); // 9 AM

  try {
    await resend.emails.send({
      from: "Laibar Wellness <hello@laibarwellness.com>",
      to: email,
      subject: `${firstName}, here's how to get the best results`,
      scheduledAt: day3.toISOString(),
      html: buildDay3Email(firstName),
    });
    console.log(`Day 3 email scheduled for ${email} at ${day3.toISOString()}`);
  } catch (err) {
    console.error("Day 3 email error:", err);
  }

  // --- Day 14: Check-in ---
  const day14 = new Date(now);
  day14.setDate(day14.getDate() + 14);
  day14.setHours(10, 0, 0, 0);

  try {
    await resend.emails.send({
      from: "Laibar Wellness <hello@laibarwellness.com>",
      to: email,
      subject: `How are your joints feeling, ${firstName}?`,
      scheduledAt: day14.toISOString(),
      html: buildDay14Email(firstName),
    });
    console.log(`Day 14 email scheduled for ${email} at ${day14.toISOString()}`);
  } catch (err) {
    console.error("Day 14 email error:", err);
  }

  // --- Day 25: Reorder Reminder ---
  const day25 = new Date(now);
  day25.setDate(day25.getDate() + 25);
  day25.setHours(9, 0, 0, 0);

  try {
    await resend.emails.send({
      from: "Laibar Wellness <hello@laibarwellness.com>",
      to: email,
      subject: "Your 30-day supply is almost up",
      scheduledAt: day25.toISOString(),
      html: buildDay25Email(firstName),
    });
    console.log(`Day 25 email scheduled for ${email} at ${day25.toISOString()}`);
  } catch (err) {
    console.error("Day 25 email error:", err);
  }

  // --- Day 30: Review Request ---
  const day30 = new Date(now);
  day30.setDate(day30.getDate() + 30);
  day30.setHours(10, 0, 0, 0);

  try {
    await resend.emails.send({
      from: "Laibar Wellness <hello@laibarwellness.com>",
      to: email,
      subject: `${firstName}, would you leave us a quick review?`,
      scheduledAt: day30.toISOString(),
      html: buildDay30Email(firstName),
    });
    console.log(`Day 30 email scheduled for ${email} at ${day30.toISOString()}`);
  } catch (err) {
    console.error("Day 30 email error:", err);
  }
}

// --- Email wrapper ---
function emailWrapper(content) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f0ece4">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="font-size:24px;color:#c8a55a;letter-spacing:3px;margin:0">LAIBAR</h1>
      <p style="font-size:10px;color:#6b6760;letter-spacing:4px;text-transform:uppercase;margin:0">Wellness</p>
    </div>
    ${content}
    <div style="text-align:center;padding:24px 0;border-top:1px solid rgba(200,165,90,0.12);margin-top:32px">
      <p style="color:#6b6760;font-size:12px;margin:0">&copy; 2026 Laibar Wellness. All rights reserved.</p>
      <p style="color:#6b6760;font-size:11px;margin:8px 0 0"><a href="${SITE_URL}" style="color:#6b6760">laibarwellness.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

// --- Day 3: Dosage Tips ---
function buildDay3Email(name) {
  return emailWrapper(`
    <div style="background:#141414;border:1px solid rgba(200,165,90,0.12);border-radius:8px;padding:32px;margin-bottom:24px">
      <h2 style="color:#f0ece4;font-size:20px;margin:0 0 16px">Hey ${name}, let's maximize your results</h2>
      <p style="color:#a8a49c;line-height:1.7;margin:0 0 16px">You've been taking Laibar Joint Support for a few days now. Here are some tips to get the most out of your formula:</p>

      <div style="background:rgba(200,165,90,0.06);border-left:3px solid #c8a55a;padding:16px;border-radius:0 8px 8px 0;margin:16px 0">
        <p style="color:#c8a55a;font-weight:600;margin:0 0 8px">Take with a meal</p>
        <p style="color:#a8a49c;margin:0;font-size:14px">The fats in food help your body absorb curcumin. Our black pepper extract boosts this even further.</p>
      </div>

      <div style="background:rgba(200,165,90,0.06);border-left:3px solid #c8a55a;padding:16px;border-radius:0 8px 8px 0;margin:16px 0">
        <p style="color:#c8a55a;font-weight:600;margin:0 0 8px">Stay consistent</p>
        <p style="color:#a8a49c;margin:0;font-size:14px">Joint support compounds build up in your system over time. Most customers feel a real difference around weeks 2-3.</p>
      </div>

      <div style="background:rgba(200,165,90,0.06);border-left:3px solid #c8a55a;padding:16px;border-radius:0 8px 8px 0;margin:16px 0">
        <p style="color:#c8a55a;font-weight:600;margin:0 0 8px">Same time every day</p>
        <p style="color:#a8a49c;margin:0;font-size:14px">Morning with breakfast or evening with dinner &mdash; pick one and stick with it. Routine = results.</p>
      </div>

      <p style="color:#a8a49c;line-height:1.7;margin:16px 0 0">Keep going &mdash; the best is yet to come.</p>
    </div>

    <div style="text-align:center">
      <a href="${SITE_URL}/about.html" style="display:inline-block;background:#c8a55a;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600">Learn About Our Ingredients</a>
    </div>
  `);
}

// --- Day 14: Check-in ---
function buildDay14Email(name) {
  return emailWrapper(`
    <div style="background:#141414;border:1px solid rgba(200,165,90,0.12);border-radius:8px;padding:32px;margin-bottom:24px">
      <h2 style="color:#f0ece4;font-size:20px;margin:0 0 16px">Two weeks in, ${name}. How do you feel?</h2>
      <p style="color:#a8a49c;line-height:1.7;margin:0 0 16px">By now, the 12 active ingredients in Laibar Joint Support have been working together in your system for two weeks. Many of our customers start noticing:</p>

      <ul style="color:#a8a49c;line-height:2;padding-left:20px;margin:0 0 16px">
        <li>Less morning stiffness</li>
        <li>Improved flexibility during workouts</li>
        <li>More comfortable movement throughout the day</li>
        <li>Better recovery after physical activity</li>
      </ul>

      <p style="color:#a8a49c;line-height:1.7;margin:0 0 16px">If you're feeling great &mdash; amazing, it only gets better from here. If you haven't noticed a change yet, don't worry. Some people need 3-4 weeks for the full effects. <strong style="color:#f0ece4">Stay consistent.</strong></p>

      <p style="color:#a8a49c;line-height:1.7;margin:0">Have questions? Just reply to this email &mdash; we read every message.</p>
    </div>

    <div style="text-align:center">
      <a href="${SITE_URL}/product-detail.html?id=1" style="display:inline-block;background:#c8a55a;color:#0a0a0a;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600">See the Full Formula</a>
    </div>
  `);
}

// --- Day 25: Reorder Reminder ---
function buildDay25Email(name) {
  return emailWrapper(`
    <div style="background:#141414;border:1px solid rgba(200,165,90,0.12);border-radius:8px;padding:32px;margin-bottom:24px">
      <h2 style="color:#f0ece4;font-size:20px;margin:0 0 16px">Heads up, ${name} &mdash; you're running low</h2>
      <p style="color:#a8a49c;line-height:1.7;margin:0 0 16px">Your 30-day supply of Laibar Joint Support is almost up. To keep your results going without a gap, now's the time to reorder.</p>

      <div style="background:rgba(200,165,90,0.08);border:1px solid rgba(200,165,90,0.2);border-radius:8px;padding:24px;margin:16px 0;text-align:center">
        <p style="color:#c8a55a;font-weight:700;font-size:18px;margin:0 0 8px">Subscribe & Save 12%</p>
        <p style="color:#a8a49c;margin:0 0 4px;font-size:14px">$57.19/month instead of $64.99</p>
        <p style="color:#6b6760;margin:0;font-size:13px">Free shipping. Cancel anytime. Never run out.</p>
      </div>

      <p style="color:#a8a49c;line-height:1.7;margin:16px 0 0">Or save even more with a bundle:</p>
      <ul style="color:#a8a49c;line-height:2;padding-left:20px;margin:8px 0 0">
        <li><strong style="color:#f0ece4">3 bottles</strong> &mdash; $54.99/ea (save 15%)</li>
        <li><strong style="color:#f0ece4">6 bottles</strong> &mdash; $47.99/ea (save 26%)</li>
      </ul>
    </div>

    <div style="text-align:center">
      <a href="${SITE_URL}/product-detail.html?id=1" style="display:inline-block;background:#c8a55a;color:#0a0a0a;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:16px">Reorder Now</a>
      <p style="color:#6b6760;font-size:12px;margin:12px 0 0">Free shipping on all orders</p>
    </div>
  `);
}

// --- Day 30: Review Request ---
function buildDay30Email(name) {
  return emailWrapper(`
    <div style="background:#141414;border:1px solid rgba(200,165,90,0.12);border-radius:8px;padding:32px;margin-bottom:24px">
      <h2 style="color:#f0ece4;font-size:20px;margin:0 0 16px">One month with Laibar, ${name}</h2>
      <p style="color:#a8a49c;line-height:1.7;margin:0 0 16px">You've been using Laibar Joint Support for 30 days. We'd love to hear how it's working for you.</p>

      <p style="color:#a8a49c;line-height:1.7;margin:0 0 16px">Your honest feedback helps other people like you make informed decisions about their joint health. It takes less than 60 seconds.</p>

      <div style="text-align:center;margin:24px 0">
        <p style="color:#c8a55a;font-size:2rem;margin:0">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
        <p style="color:#6b6760;font-size:13px;margin:4px 0 0">Tap a star or click below to leave your review</p>
      </div>
    </div>

    <div style="text-align:center">
      <a href="${SITE_URL}/product-detail.html?id=1#tab-reviews" style="display:inline-block;background:#c8a55a;color:#0a0a0a;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:16px">Write a Review</a>
      <p style="color:#6b6760;font-size:12px;margin:12px 0 0">Thank you for being part of the Laibar community.</p>
    </div>
  `);
}

module.exports = { sendPostPurchaseSequence };
