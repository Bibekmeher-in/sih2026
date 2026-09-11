import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

async function nextAuthLogin(email, password) {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfCookie = csrfRes.headers.get("set-cookie");

  const form = new URLSearchParams();
  form.append("csrfToken", csrfData.csrfToken);
  form.append("email", email);
  form.append("password", password);
  form.append("json", "true");

  const callbackRes = await fetch(`${BASE_URL}/api/auth/callback/credentials?`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie || "",
    },
    body: form.toString(),
    redirect: "manual",
  });

  const setCookies = callbackRes.headers.raw()["set-cookie"] || [];
  return setCookies.map(c => c.split(";")[0]).join("; ");
}

async function testBuyerAssistant() {
  console.log("=== TESTING BUYER ASSISTANT API ===");
  const buyerCookie = await nextAuthLogin("buyer@example.com", "Kisan@1234");
  
  const res = await fetch(`${BASE_URL}/api/ai/buyer-assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: buyerCookie,
    },
    body: JSON.stringify({ query: "Find fresh tomatoes" }),
  });

  const data = await res.json();
  console.log("Response Status:", res.status);
  console.log("Success:", data.success);
  console.log("Answer / Summary:", data.answer?.slice(0, 80) + "...");
  console.log("Matched Products Count:", data.matchedProducts?.length);
  console.log("Total Stock in Market:", data.totalAvailableInMarket);
  console.log("Model:", data.model);

  if (Array.isArray(data.matchedProducts)) {
    console.log("PASS: matchedProducts is an array, eliminating the TypeError!");
  } else {
    console.error("FAIL: matchedProducts is not an array!");
  }
}

testBuyerAssistant().catch(console.error);
