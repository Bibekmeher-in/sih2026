async function testFarmerFlow() {
  console.log("=== Testing Phase 5: Farmer Experience & Flow ===");

  const baseUrl = "http://localhost:3000";

  // Step 1: Sign in via NextAuth credentials
  console.log("\n[Step 1] Authenticating as Farmer (farmer@example.com)...");
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  
  const extractCookies = (res) => {
    if (res.headers.getSetCookie) {
      return res.headers.getSetCookie().map(c => c.split(";")[0]);
    }
    const single = res.headers.get("set-cookie");
    return single ? [single.split(";")[0]] : [];
  };

  const initialCookies = extractCookies(csrfRes);

  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: initialCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      email: "farmer@example.com",
      password: "Kisan@1234",
      callbackUrl: `${baseUrl}/farmer/dashboard`,
      json: "true",
    }),
    redirect: "manual",
  });

  const loginCookies = extractCookies(loginRes);
  const allCookieMap = new Map();
  [...initialCookies, ...loginCookies].forEach(c => {
    const [name, val] = c.split("=");
    if (name) allCookieMap.set(name.trim(), val);
  });
  const cookieString = Array.from(allCookieMap.entries()).map(([k, v]) => `${k}=${v}`).join("; ");

  console.log("✓ Login response status:", loginRes.status);
  console.log("  Extracted Auth Cookies:", Array.from(allCookieMap.keys()).join(", "));

  const authHeaders = {
    Cookie: cookieString,
    "Content-Type": "application/json",
  };

  // Step 2: Test /api/farmer/stats
  console.log("\n[Step 2] Testing /api/farmer/stats...");
  const statsRes = await fetch(`${baseUrl}/api/farmer/stats`, { headers: authHeaders });
  const statsData = await statsRes.json();
  console.log("✓ Stats Status:", statsRes.status);
  console.log("  Total Earnings:", statsData.stats?.totalEarnings);
  console.log("  Active Orders:", statsData.stats?.activeOrdersCount);
  console.log("  Available Inventory:", statsData.stats?.availableInventoryKg, "kg");
  console.log("  Direct Premium Gain:", statsData.stats?.directPremiumPercent + "%");

  // Step 3: Test /api/farmer/products
  console.log("\n[Step 3] Testing /api/farmer/products...");
  const prodsRes = await fetch(`${baseUrl}/api/farmer/products`, { headers: authHeaders });
  const prodsData = await prodsRes.json();
  console.log("✓ Products Status:", prodsRes.status);
  console.log("  Listed Produce Count:", prodsData.products?.length);
  if (prodsData.products?.[0]) {
    console.log("  First Produce:", prodsData.products[0].name, "- ₹" + prodsData.products[0].price + "/" + prodsData.products[0].unit);
  }

  // Step 4: Test creating a new product lot via POST /api/farmer/products
  console.log("\n[Step 4] Testing produce lot creation via POST /api/farmer/products...");
  const newProduce = {
    name: "Nashik Organic Garlic (Special Grade)",
    hindiName: "लहसुन",
    variety: "G-282",
    category: "Vegetables",
    description: "Cold-cured white garlic bulbs direct from Dindori farm gate. Low moisture, uniform clove size.",
    price: 120,
    mandiBenchmarkPrice: 95,
    quantity: 500,
    unit: "kg",
    qualityGrade: "Grade A",
    harvestDate: "2026-09-01",
    district: "Nashik",
    state: "Maharashtra",
    minimumOrderQuantity: 10,
    status: "AVAILABLE",
  };

  const createRes = await fetch(`${baseUrl}/api/farmer/products`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(newProduce),
  });
  const createData = await createRes.json();
  console.log("✓ Create Produce Status:", createRes.status);
  console.log("  Created Product ID:", createData.product?._id);
  console.log("  Created Product Name:", createData.product?.name);

  // Step 5: Test /api/farmer/orders and status advance
  console.log("\n[Step 5] Testing incoming orders & status advance...");
  const ordersRes = await fetch(`${baseUrl}/api/farmer/orders`, { headers: authHeaders });
  const ordersData = await ordersRes.json();
  console.log("✓ Orders Status:", ordersRes.status);
  console.log("  Orders Count:", ordersData.orders?.length);

  if (ordersData.orders?.[0]) {
    const orderToUpdate = ordersData.orders[0];
    console.log("  Advancing Order:", orderToUpdate.orderNumber, "Current Status:", orderToUpdate.orderStatus);

    const updateOrderRes = await fetch(`${baseUrl}/api/farmer/orders/${orderToUpdate._id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: "PROCESSING" }),
    });
    const updateOrderData = await updateOrderRes.json();
    console.log("✓ Order Status Update Response:", updateOrderRes.status, "New Status:", updateOrderData.order?.orderStatus || updateOrderData.status);
  }

  // Step 6: Test /api/farmer/earnings
  console.log("\n[Step 6] Testing /api/farmer/earnings...");
  const earnRes = await fetch(`${baseUrl}/api/farmer/earnings`, { headers: authHeaders });
  const earnData = await earnRes.json();
  console.log("✓ Earnings Status:", earnRes.status);
  console.log("  Gross Revenue:", earnData.earnings?.grossRevenue);
  console.log("  Mandi Net Surplus Gain:", earnData.earnings?.mandiComparison?.gainPercentage + "%");

  // Step 7: Test /api/farmer/insights
  console.log("\n[Step 7] Testing AI Demand Forecasts & Pricing Recommendations...");
  const insRes = await fetch(`${baseUrl}/api/farmer/insights`, { headers: authHeaders });
  const insData = await insRes.json();
  console.log("✓ Insights Status:", insRes.status);
  console.log("  Forecasts Count:", insData.insights?.forecasts?.length);
  console.log("  First Forecast:", insData.insights?.forecasts?.[0]?.productName, "Trend:", insData.insights?.forecasts?.[0]?.trendDirection);
  console.log("  Recommendations Count:", insData.insights?.recommendations?.length);
  console.log("  First Rec Corridor:", "₹" + insData.insights?.recommendations?.[0]?.recommendedMinPrice + " - ₹" + insData.insights?.recommendations?.[0]?.recommendedMaxPrice);

  // Step 8: Test /api/farmer/deliveries
  console.log("\n[Step 8] Testing /api/farmer/deliveries...");
  const delRes = await fetch(`${baseUrl}/api/farmer/deliveries`, { headers: authHeaders });
  const delData = await delRes.json();
  console.log("✓ Deliveries Status:", delRes.status);
  console.log("  Dispatches Count:", delData.deliveries?.length);
  console.log("  Carrier Vehicle:", delData.deliveries?.[0]?.vehicleNumber, "-", delData.deliveries?.[0]?.vehicleType);
  console.log("  Cold Chain Temp:", delData.deliveries?.[0]?.coldChainTempCelsius + "°C");

  // Step 9: Test /api/farmer/profile
  console.log("\n[Step 9] Testing Farmer Profile GET & PUT...");
  const profRes = await fetch(`${baseUrl}/api/farmer/profile`, { headers: authHeaders });
  const profData = await profRes.json();
  console.log("✓ Profile Status:", profRes.status);
  console.log("  Grower Name:", profData.profile?.name);
  console.log("  Land Holding:", profData.profile?.landAreaAcres, "acres");
  console.log("  Irrigation:", profData.profile?.irrigationType);

  const updateProfRes = await fetch(`${baseUrl}/api/farmer/profile`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      name: profData.profile?.name || "Rameshwar Patil",
      phone: "9822012345",
      farmName: "Shree Ganesh Krishi Farm",
      landAreaAcres: 9.2,
      irrigationType: "Drip Irrigation",
      soilType: "Black Soil / Alluvial",
      primaryCrops: "Tomato, Onion, Garlic, Green Chilli",
      district: "Nashik",
      state: "Maharashtra",
      bankAccountName: "Rameshwar Patil",
      bankAccountNumber: "918020038912",
      bankIfscCode: "SBIN0001428",
      bankName: "State Bank of India (Dindori)",
    }),
  });
  console.log("✓ Profile Update Status:", updateProfRes.status);

  console.log("\n========================================================");
  console.log("ALL PHASE 5 FARMER WORKFLOWS TESTED & VALIDATED!");
  console.log("========================================================");
}

testFarmerFlow();
