exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method not allowed" });
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return respond(400, { error: "Valid email is required" });
    }

    // Subscribe to Buttondown
    if (process.env.BUTTONDOWN_API_KEY) {
      const res = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          tags: ["website-footer"],
        }),
      });

      if (!res.ok && res.status !== 409) {
        // 409 = already subscribed, which is fine
        const errData = await res.json().catch(() => ({}));
        console.error("Buttondown error:", res.status, errData);
      }
    } else {
      console.log("Newsletter signup (no Buttondown key):", email);
    }

    return respond(200, { success: true });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
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
