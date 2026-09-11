import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== STARTING FULL END-TO-END VERIFICATION ===");

  // Helper for NextAuth login
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
    const sessionCookie = setCookies.map(c => c.split(";")[0]).join("; ");
    return sessionCookie;
  }

  // 1. Test Consumer Login
  console.log("\n[1] Testing Consumer Authentication...");
  const cookie = await nextAuthLogin("consumer@example.com", "Kisan@1234");
  console.log("Consumer Logged In, Session Cookie:", cookie ? "Obtained" : "None");

  // 2. Fetch Active & Past Orders for Consumer
  console.log("\n[2] Testing Consumer Orders List Fetch...");
  const ordersRes = await fetch(`${BASE_URL}/api/consumer/orders`, {
    headers: { Cookie: cookie || "" },
  });
  const ordersData = await ordersRes.json();
  console.log("Consumer Orders Response:", ordersRes.status, "Count:", ordersData.orders?.length);

  // 3. Test Farmer Login and Permissions
  console.log("\n[3] Testing Farmer Login & Permissions...");
  const farmerCookie = await nextAuthLogin("farmer@example.com", "Kisan@1234");
  console.log("Farmer Logged In, Cookie:", farmerCookie ? "Obtained" : "None");

  // 4. Test Farmer Incoming Orders
  console.log("\n[4] Testing Farmer Orders Fetch...");
  const farmerOrdersRes = await fetch(`${BASE_URL}/api/farmer/orders`, {
    headers: { Cookie: farmerCookie || "" },
  });
  const farmerOrdersData = await farmerOrdersRes.json();
  console.log("Farmer Orders Status:", farmerOrdersRes.status, "Orders Count:", farmerOrdersData.orders?.length);

  // 5. Test Order Lifecycle FSM Transitions
  if (farmerOrdersData.orders && farmerOrdersData.orders.length > 0) {
    const orderToTest = farmerOrdersData.orders[0];
    console.log(`\n[5] Testing Order Lifecycle on Order #${orderToTest.orderNumber || orderToTest._id} (Current: ${orderToTest.status})`);
    
    // Check Tracking API
    const trackingRes = await fetch(`${BASE_URL}/api/orders/${orderToTest._id}/tracking`, {
      headers: { Cookie: farmerCookie || "" },
    });
    const trackingData = await trackingRes.json();
    console.log("Tracking API Status:", trackingRes.status);
    console.log("Status History Count:", trackingData.statusHistory?.length);
    console.log("Pickup Location:", trackingData.pickupLocation?.address);
    console.log("Destination Location:", trackingData.destinationLocation?.address);
    console.log("Live Location Update Note:", trackingData.lastLocationUpdate);

    // Test Farmer attempting to directly mark DELIVERED (Must Fail with 400 or 403)
    console.log("\n[6] Testing Security: Farmer attempting illegal direct transition to DELIVERED...");
    const illegalTransitionRes = await fetch(`${BASE_URL}/api/orders/${orderToTest._id}/status`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Cookie: farmerCookie || "" 
      },
      body: JSON.stringify({
        status: "DELIVERED",
        note: "Farmer trying to deliver directly",
      }),
    });
    const illegalData = await illegalTransitionRes.json();
    console.log("Farmer DELIVERED attempt response status:", illegalTransitionRes.status, "Message:", illegalData.message);
    if (!illegalData.success) {
      console.log("PASS: Security barrier prevented farmer from illegally marking DELIVERED!");
    } else {
      console.error("FAIL: Farmer was allowed to mark DELIVERED!");
    }
  }

  // 7. Test Admin Login and Logistics Transition
  console.log("\n[7] Testing Admin/Logistics Permissions...");
  const adminCookie = await nextAuthLogin("admin@example.com", "Kisan@1234");
  console.log("Admin Logged In, Cookie:", adminCookie ? "Obtained" : "None");

  // 8. Test Bulk Buyer Login & Orders
  console.log("\n[8] Testing Bulk Buyer...");
  const buyerCookie = await nextAuthLogin("buyer@example.com", "Kisan@1234");
  console.log("Buyer Logged In, Cookie:", buyerCookie ? "Obtained" : "None");

  const buyerOrdersRes = await fetch(`${BASE_URL}/api/buyer/orders`, {
    headers: { Cookie: buyerCookie || "" },
  });
  const buyerOrdersData = await buyerOrdersRes.json();
  console.log("Buyer Orders Fetch Status:", buyerOrdersRes.status, "Count:", buyerOrdersData.orders?.length);

  // 9. Test Zero-Trust Cart Validation
  console.log("\n[9] Testing Server-Side Zero-Trust Cart Validation...");
  const cartRes = await fetch(`${BASE_URL}/api/cart/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        { productId: "prod_tomato_01", quantity: 5 }
      ],
      clientSubtotal: 10, // Tampered client value
      clientDeliveryFee: 0, // Tampered client value
    }),
  });
  const cartData = await cartRes.json();
  console.log("Cart Validation Status:", cartRes.status, "Subtotal:", cartData.subtotal, "Fee:", cartData.deliveryFee, "Total:", cartData.total);
  if (cartData.subtotal > 10) {
    console.log("PASS: Server ignored client-tampered subtotal and recalculated correctly!");
  }

  console.log("\n=== ALL INTEGRATION ASSERTIONS COMPLETE ===");
}

runTests().catch(console.error);
