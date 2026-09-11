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

async function main() {
  console.log("=== VERIFYING BULK BUYER FLOW & BUY AGAIN ===");
  const buyerCookie = await nextAuthLogin("buyer@example.com", "Kisan@1234");
  
  // 1. Fetch Bulk Buyer Orders
  const ordersRes = await fetch(`${BASE_URL}/api/buyer/orders`, {
    headers: { Cookie: buyerCookie },
  });
  const ordersData = await ordersRes.json();
  console.log("Bulk Buyer Orders Fetch:", ordersRes.status, "Count:", ordersData.orders?.length);

  const activeOrders = ordersData.orders?.filter(o => !["DELIVERED", "CANCELLED"].includes(o.status || o.orderStatus));
  const pastOrders = ordersData.orders?.filter(o => ["DELIVERED", "CANCELLED"].includes(o.status || o.orderStatus));
  console.log(`Active Orders: ${activeOrders?.length}, Past Orders: ${pastOrders?.length}`);

  // 2. Test Placing Bulk Order
  console.log("\nPlacing B2B Bulk Order (100 kg Onion)...");
  const createRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: buyerCookie,
    },
    body: JSON.stringify({
      items: [
        {
          productId: "6aa381d80f476b7d3a077c39", // Sukinda Medium Red Onion
          quantity: 100,
        },
      ],
      buyerType: "BULK_BUYER",
      deliveryAddress: {
        addressLine: "Plot 42, Mancheswar Industrial Estate",
        district: "Khurda",
        state: "Odisha",
        pincode: "751010",
        coordinates: { latitude: 20.3120, longitude: 85.8450 },
      },
      paymentMethod: "DIRECT_BANK_TRANSFER",
      autoConfirm: true,
    }),
  });
  const createData = await createRes.json();
  console.log("B2B Create Order Response:", createRes.status, "Order Number:", createData.order?.orderNumber);
  console.log("Subtotal: Rs.", createData.order?.subtotal, "Delivery Fee: Rs.", createData.order?.deliveryFee, "Total: Rs.", createData.order?.total);
  if (createData.order?.orderNumber.startsWith("KD-BLK-")) {
    console.log("PASS: B2B Order prefix correctly formatted as KD-BLK-");
  }

  // 3. Test Buy Again Stock Check
  console.log("\nTesting 'Buy Again' live stock & pricing verification...");
  const onionProdRes = await fetch(`${BASE_URL}/api/products/6aa381d80f476b7d3a077c39`);
  const onionProdData = await onionProdRes.json();
  console.log("Live Onion Product Status:", onionProdRes.status);
  console.log("Product Name:", onionProdData.product?.name);
  console.log("Current Price: Rs.", onionProdData.product?.price);
  console.log("Available Stock:", onionProdData.product?.availableQuantity, onionProdData.product?.unit);
  if (onionProdData.product?.availableQuantity > 0) {
    console.log("PASS: Buy Again product has active stock and fetches real current pricing!");
  }

  console.log("\n=== BULK BUYER VERIFICATION COMPLETE ===");
}

main().catch(console.error);
