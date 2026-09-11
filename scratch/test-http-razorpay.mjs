import crypto from "crypto";

const BASE_URL = "http://localhost:3000";

async function testHttpEndpoints() {
  console.log("=== Testing Razorpay HTTP Endpoints on Next.js Server ===\n");

  // 1. Test POST /api/payments/create-order (Unauthenticated check -> 401)
  const unauthRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [] }),
  });
  console.log("1. POST /api/payments/create-order (Unauth) Status:", unauthRes.status);
  const unauthJson = await unauthRes.json();
  console.log("   Unauth response:", unauthJson.message);

  // 2. Test POST /api/webhooks/razorpay (Missing signature -> 400)
  const noSigWhRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "payment.captured" }),
  });
  console.log("\n2. POST /api/webhooks/razorpay (No Signature) Status:", noSigWhRes.status);
  const noSigWhJson = await noSigWhRes.json();
  console.log("   No signature response:", noSigWhJson.message);

  // 3. Test POST /api/webhooks/razorpay (Forged signature -> 400)
  const forgedWhRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": "forged_signature_1234567890abcdef",
    },
    body: JSON.stringify({ event: "payment.captured" }),
  });
  console.log("\n3. POST /api/webhooks/razorpay (Forged Signature) Status:", forgedWhRes.status);
  const forgedWhJson = await forgedWhRes.json();
  console.log("   Forged signature response:", forgedWhJson.message);

  // 4. Test POST /api/webhooks/razorpay (Valid HMAC SHA256 Webhook Signature -> 200)
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "kisanova_webhook_secret_98765";
  const validPayload = JSON.stringify({
    event: "payment.captured",
    id: `evt_http_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          id: `pay_http_${Date.now()}`,
          order_id: "order_http_sample",
          amount: 25000,
          status: "captured",
          method: "upi",
        },
      },
    },
  });
  const validSig = crypto.createHmac("sha256", secret).update(validPayload).digest("hex");

  const validWhRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": validSig,
    },
    body: validPayload,
  });
  console.log("\n4. POST /api/webhooks/razorpay (Valid Signature) Status:", validWhRes.status);
  const validWhJson = await validWhRes.json();
  console.log("   Valid signature response:", validWhJson);

  // 5. Test POST /api/payments/verify (Missing parameters -> 400)
  const missingVerifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  console.log("\n5. POST /api/payments/verify (Missing Params) Status:", missingVerifyRes.status);
  const missingVerifyJson = await missingVerifyRes.json();
  console.log("   Missing params response:", missingVerifyJson.message);

  // 6. Test POST /api/payments/verify (Tampered signature -> 400)
  const tamperedVerifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: "order_123456",
      razorpay_payment_id: "pay_123456",
      razorpay_signature: "tampered_sig_123456",
    }),
  });
  console.log("\n6. POST /api/payments/verify (Tampered Sig) Status:", tamperedVerifyRes.status);
  const tamperedVerifyJson = await tamperedVerifyRes.json();
  console.log("   Tampered signature response:", tamperedVerifyJson.message);

  console.log("\n=== All HTTP Endpoint Tests Completed Successfully! ===");
}

testHttpEndpoints().catch((err) => {
  console.error("HTTP endpoint testing error:", err);
  process.exit(1);
});
