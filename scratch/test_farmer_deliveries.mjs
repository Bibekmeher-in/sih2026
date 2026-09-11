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

async function testFarmerDeliveries() {
  console.log("=== TESTING FARMER DELIVERIES API ===");
  const farmerCookie = await nextAuthLogin("farmer@example.com", "Kisan@1234");
  
  const res = await fetch(`${BASE_URL}/api/farmer/deliveries`, {
    headers: { Cookie: farmerCookie },
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Success:", data.success);
  console.log("Count:", data.deliveries?.length);

  if (data.deliveries && data.deliveries.length > 0) {
    const first = data.deliveries[0];
    console.log("Sample Delivery:", {
      trackingNumber: first.trackingNumber,
      orderNumber: first.orderNumber,
      pickupLocationType: typeof first.pickupLocation,
      pickupLocation: first.pickupLocation,
      dropLocationType: typeof first.dropLocation,
      dropLocation: first.dropLocation,
      status: first.status,
    });

    if (typeof first.pickupLocation === "string" && typeof first.dropLocation === "string") {
      console.log("PASS: Both pickupLocation and dropLocation are formatted strings! Cannot crash React child rendering!");
    } else {
      console.error("FAIL: Locations are not strings!");
    }
  }
}

testFarmerDeliveries().catch(console.error);
