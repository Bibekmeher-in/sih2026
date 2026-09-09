/**
 * PHASE 7 — ORDER AND INVENTORY ENGINE VERIFICATION TEST SUITE
 * Tests:
 * 1. Successful order creation & inventory reservation
 * 2. Insufficient inventory prevention
 * 3. Invalid product rejection
 * 4. Unauthorized order rejection
 * 5. Price tampering prevention (zero client trust)
 * 6. Invalid status transition rejection (FSM enforcement)
 * 7. Order cancellation & inventory restocking
 * 8. Notification generation across lifecycle
 */

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/KISANOVA";
const BASE_URL = "http://localhost:3000";

async function runPhase7Tests() {
  console.log("===============================================================================");
  console.log("   PHASE 7: ORDER AND INVENTORY ENGINE VERIFICATION TEST SUITE");
  console.log("===============================================================================");

  // Step 0: Connect to MongoDB
  console.log("\n[SETUP] Connecting to MongoDB to inspect database state...");
  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB at:", MONGO_URI);

  const db = mongoose.connection.db;
  const productsCol = db.collection("products");
  const inventoriesCol = db.collection("inventories");
  const ordersCol = db.collection("orders");
  const notificationsCol = db.collection("notifications");
  const usersCol = db.collection("users");

  // Fetch or setup a test product
  let testProduct = await productsCol.findOne({ status: "AVAILABLE", availableQuantity: { $gt: 50 } });
  if (!testProduct) {
    // Pick any product and ensure sufficient availableQuantity
    testProduct = await productsCol.findOne();
    if (testProduct) {
      await productsCol.updateOne(
        { _id: testProduct._id },
        { $set: { availableQuantity: 500, status: "AVAILABLE" } }
      );
      testProduct.availableQuantity = 500;
    }
  }

  if (!testProduct) {
    throw new Error("No product found in database to test with. Run seed first.");
  }

  const productId = testProduct._id.toString();
  const initialAvailableQty = testProduct.availableQuantity;
  const unitPrice = testProduct.price;

  console.log(`✓ Using Test Product: "${testProduct.name}" (ID: ${productId})`);
  console.log(`  Real DB Price: ₹${unitPrice}/${testProduct.unit}`);
  console.log(`  Initial Available Qty: ${initialAvailableQty} ${testProduct.unit}`);

  // Ensure inventory record exists
  let invRecord = await inventoriesCol.findOne({ product: testProduct._id });
  if (!invRecord) {
    await inventoriesCol.insertOne({
      product: testProduct._id,
      currentQuantity: initialAvailableQty,
      reservedQuantity: 0,
      availableQuantity: initialAvailableQty,
      unit: testProduct.unit || "kg",
      lastStockUpdate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    invRecord = await inventoriesCol.findOne({ product: testProduct._id });
  }

  const initialInvCurrent = invRecord.currentQuantity;
  const initialInvReserved = invRecord.reservedQuantity;
  const initialInvAvailable = invRecord.availableQuantity;

  console.log(`  Initial Inventory Doc: current=${initialInvCurrent}, reserved=${initialInvReserved}, available=${initialInvAvailable}`);

  // Authenticate as Consumer via NextAuth
  console.log("\n[AUTH] Authenticating as Consumer (consumer@example.com)...");
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  const extractCookies = (res) => {
    if (res.headers.getSetCookie) {
      return res.headers.getSetCookie().map((c) => c.split(";")[0]);
    }
    const single = res.headers.get("set-cookie");
    return single ? [single.split(";")[0]] : [];
  };

  const initialCookies = extractCookies(csrfRes);

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: initialCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      email: "consumer@example.com",
      password: "Kisan@1234",
      callbackUrl: `${BASE_URL}/consumer/dashboard`,
      json: "true",
    }),
    redirect: "manual",
  });

  const loginCookies = extractCookies(loginRes);
  const allCookieMap = new Map();
  [...initialCookies, ...loginCookies].forEach((c) => {
    const [name, val] = c.split("=");
    if (name) allCookieMap.set(name.trim(), val);
  });
  const cookieHeader = Array.from(allCookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  const authHeaders = {
    Cookie: cookieHeader,
    "Content-Type": "application/json",
  };

  const consumerUser = await usersCol.findOne({ email: "consumer@example.com" });
  console.log("✓ Logged in as:", consumerUser.name, `(${consumerUser._id})`);

  let createdOrderId = null;
  let testOrderNumber = null;
  const orderQuantity = 5;

  // =========================================================================
  // TEST 1: SUCCESSFUL ORDER CREATION & INVENTORY RESERVATION
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 1: Successful Order Creation & Inventory Reservation");
  console.log("-------------------------------------------------------------------------------");

  const orderPayload = {
    items: [
      {
        productId,
        quantity: orderQuantity,
      },
    ],
    deliveryAddress: {
      recipientName: "Ananya Sharma",
      recipientPhone: "9820011223",
      addressLine: "Flat 402, Green Acre Heights, Baner Road",
      district: "Pune",
      state: "Maharashtra",
      pincode: "411045",
    },
    paymentMethod: "UPI",
    autoConfirm: false, // Create in PENDING state to test FSM
  };

  const createRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(orderPayload),
  });

  const createData = await createRes.json();
  console.log("Response Status:", createRes.status);
  console.log("Response Data:", JSON.stringify(createData, null, 2));

  if (createRes.status !== 201 || !createData.success) {
    throw new Error(`TEST 1 FAILED: Expected 201 Created, got ${createRes.status}`);
  }

  createdOrderId = createData.order._id;
  testOrderNumber = createData.order.orderNumber;
  console.log(`✓ Order Created: ID = ${createdOrderId}, Number = ${testOrderNumber}`);

  // Verify server-side calculation:
  const expectedSubtotal = Math.round(unitPrice * orderQuantity * 100) / 100;
  const expectedDeliveryFee = expectedSubtotal >= 500 ? 0 : 40;
  const expectedTotal = Math.round((expectedSubtotal + expectedDeliveryFee) * 100) / 100;

  if (createData.order.subtotal !== expectedSubtotal) {
    throw new Error(`TEST 1 FAILED: Subtotal mismatch. Expected ${expectedSubtotal}, got ${createData.order.subtotal}`);
  }
  if (createData.order.total !== expectedTotal) {
    throw new Error(`TEST 1 FAILED: Grand total mismatch. Expected ${expectedTotal}, got ${createData.order.total}`);
  }
  console.log(`✓ Server-side calculation verified: Subtotal = ₹${createData.order.subtotal}, Fee = ₹${createData.order.deliveryFee}, Total = ₹${createData.order.total}`);

  // Verify inventory reservation in MongoDB
  const updatedProductAfterOrder = await productsCol.findOne({ _id: testProduct._id });
  const updatedInvAfterOrder = await inventoriesCol.findOne({ product: testProduct._id });

  const expectedAvail = initialAvailableQty - orderQuantity;
  const expectedReserved = initialInvReserved + orderQuantity;

  console.log(`  Product stock: Available ${updatedProductAfterOrder.availableQuantity} (expected ${expectedAvail})`);
  console.log(`  Inventory stock: Reserved ${updatedInvAfterOrder.reservedQuantity} (expected ${expectedReserved}), Available ${updatedInvAfterOrder.availableQuantity} (expected ${expectedAvail})`);

  if (updatedProductAfterOrder.availableQuantity !== expectedAvail) {
    throw new Error(`TEST 1 FAILED: Product availableQuantity not decremented correctly.`);
  }
  if (updatedInvAfterOrder.reservedQuantity !== expectedReserved) {
    throw new Error(`TEST 1 FAILED: Inventory reservedQuantity not incremented correctly.`);
  }
  console.log("✓ TEST 1 PASSED: Order created, prices calculated server-side, inventory reserved atomically!");

  // =========================================================================
  // TEST 2: INSUFFICIENT INVENTORY
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 2: Insufficient Inventory Prevention");
  console.log("-------------------------------------------------------------------------------");

  const excessivePayload = {
    items: [
      {
        productId,
        quantity: 9999999, // Way more than available stock
      },
    ],
    deliveryAddress: orderPayload.deliveryAddress,
  };

  const insufficientRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(excessivePayload),
  });

  const insufficientData = await insufficientRes.json();
  console.log("Response Status:", insufficientRes.status);
  console.log("Response Message:", insufficientData.message);

  if (insufficientRes.status !== 409 && insufficientRes.status !== 400) {
    throw new Error(`TEST 2 FAILED: Expected 409 Conflict, got ${insufficientRes.status}`);
  }

  // Verify inventory was NOT modified by failed order
  const invAfterExcessive = await inventoriesCol.findOne({ product: testProduct._id });
  if (invAfterExcessive.reservedQuantity !== expectedReserved) {
    throw new Error("TEST 2 FAILED: Inventory was modified despite rejection!");
  }
  console.log("✓ TEST 2 PASSED: Overselling prevented! Request correctly rejected with status 409.");

  // =========================================================================
  // TEST 3: INVALID PRODUCT ID
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 3: Invalid Product Rejection");
  console.log("-------------------------------------------------------------------------------");

  const fakeProductId = new mongoose.Types.ObjectId().toString();
  const invalidProdPayload = {
    items: [{ productId: fakeProductId, quantity: 2 }],
    deliveryAddress: orderPayload.deliveryAddress,
  };

  const invalidProdRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(invalidProdPayload),
  });

  const invalidProdData = await invalidProdRes.json();
  console.log("Response Status:", invalidProdRes.status);
  console.log("Response Message:", invalidProdData.message);

  if (invalidProdRes.status !== 404) {
    throw new Error(`TEST 3 FAILED: Expected 404 Not Found, got ${invalidProdRes.status}`);
  }
  console.log("✓ TEST 3 PASSED: Non-existent product cleanly rejected with status 404.");

  // =========================================================================
  // TEST 4: UNAUTHORIZED ORDER
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 4: Unauthorized Order Rejection");
  console.log("-------------------------------------------------------------------------------");

  const unauthorizedRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // No auth cookie
    body: JSON.stringify(orderPayload),
  });

  const unauthorizedData = await unauthorizedRes.json();
  console.log("Response Status:", unauthorizedRes.status);
  console.log("Response Message:", unauthorizedData.message);

  if (unauthorizedRes.status !== 401) {
    throw new Error(`TEST 4 FAILED: Expected 401 Unauthorized, got ${unauthorizedRes.status}`);
  }
  console.log("✓ TEST 4 PASSED: Unauthenticated request rejected with status 401.");

  // =========================================================================
  // TEST 5: PRICE TAMPERING PREVENTION (ZERO CLIENT TRUST)
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 5: Price Tampering Prevention (Zero Trust Architecture)");
  console.log("-------------------------------------------------------------------------------");

  const spoofedPayload = {
    items: [
      {
        productId,
        quantity: 2,
        price: 1, // Spoofed: claiming price is ₹1 instead of ₹28
        unitPrice: 1,
        totalItemPrice: 2,
      },
    ],
    deliveryAddress: orderPayload.deliveryAddress,
    subtotal: 2, // Spoofed subtotal
    deliveryFee: 0, // Spoofed free delivery
    total: 2, // Spoofed total: ₹2 instead of real total
    sellerId: new mongoose.Types.ObjectId().toString(), // Spoofed seller ID
  };

  const tamperRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(spoofedPayload),
  });

  const tamperData = await tamperRes.json();
  console.log("Response Status:", tamperRes.status);
  console.log("Spoofed client total: ₹2");
  console.log("Server assigned total: ₹", tamperData.order?.total);
  console.log("Server assigned subtotal: ₹", tamperData.order?.subtotal);

  const realExpectedSubtotal = Math.round(unitPrice * 2 * 100) / 100;
  const realExpectedDeliveryFee = realExpectedSubtotal >= 500 ? 0 : 40;
  const realExpectedTotal = realExpectedSubtotal + realExpectedDeliveryFee;

  if (tamperData.order.total === 2 || tamperData.order.total !== realExpectedTotal) {
    throw new Error(`TEST 5 FAILED: Price tampering was accepted! Order total is ${tamperData.order.total}, expected ${realExpectedTotal}`);
  }

  // Cancel this extra test order so inventory stays clean
  await fetch(`${BASE_URL}/api/orders/${tamperData.order._id}/cancel`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ reason: "Cleanup tamper test" }),
  });
  console.log("✓ TEST 5 PASSED: Client prices completely ignored. Server strictly computed ₹" + realExpectedTotal + "!");

  // =========================================================================
  // TEST 6: INVALID STATUS TRANSITION (FSM ENFORCEMENT)
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 6: Invalid Status Transition Rejection (FSM)");
  console.log("-------------------------------------------------------------------------------");

  // Attempt illegal transition: PENDING directly to DELIVERED
  console.log(`Attempting illegal transition: PENDING -> DELIVERED for order ${createdOrderId}`);
  const invalidTransitionRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/status`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ status: "DELIVERED" }),
  });

  const invalidTransitionData = await invalidTransitionRes.json();
  console.log("Response Status:", invalidTransitionRes.status);
  console.log("Response Message:", invalidTransitionData.message);

  if (invalidTransitionRes.status !== 400) {
    throw new Error(`TEST 6 FAILED: Expected 400 Bad Request on invalid transition, got ${invalidTransitionRes.status}`);
  }

  // Verify order status is still PENDING
  const orderDocCheck = await ordersCol.findOne({ _id: new mongoose.Types.ObjectId(createdOrderId) });
  if (orderDocCheck.orderStatus !== "PENDING") {
    throw new Error(`TEST 6 FAILED: Order status changed despite invalid transition! Current: ${orderDocCheck.orderStatus}`);
  }
  console.log("✓ TEST 6 PASSED: Invalid FSM transition was rejected! Order remains in PENDING state.");

  // Test legal intermediate transition: PENDING -> CONFIRMED -> PROCESSING
  console.log("\nTesting legal sequential transition: PENDING -> CONFIRMED...");
  const confirmRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/status`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  const confirmData = await confirmRes.json();
  console.log("CONFIRM Response Status:", confirmRes.status, "Order Status:", confirmData.order?.orderStatus);

  if (confirmRes.status !== 200 || confirmData.order?.orderStatus !== "CONFIRMED") {
    throw new Error("TEST 6 FAILED: Legal transition PENDING -> CONFIRMED failed");
  }
  console.log("✓ Legal transition PENDING -> CONFIRMED accepted.");

  // =========================================================================
  // TEST 7: ORDER CANCELLATION & INVENTORY RESTOCK
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 7: Order Cancellation & Inventory Restock");
  console.log("-------------------------------------------------------------------------------");

  const cancelRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/cancel`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ reason: "Customer requested change of address" }),
  });

  const cancelData = await cancelRes.json();
  console.log("Cancel Response Status:", cancelRes.status);
  console.log("Cancel Response Message:", cancelData.message);

  if (cancelRes.status !== 200 || !cancelData.success) {
    throw new Error(`TEST 7 FAILED: Expected 200 OK for cancel, got ${cancelRes.status}`);
  }

  // Verify order in MongoDB is CANCELLED and REFUNDED
  const cancelledOrderDoc = await ordersCol.findOne({ _id: new mongoose.Types.ObjectId(createdOrderId) });
  console.log("Cancelled Order Status:", cancelledOrderDoc.orderStatus);
  console.log("Cancelled Payment Status:", cancelledOrderDoc.paymentStatus);

  if (cancelledOrderDoc.orderStatus !== "CANCELLED" || cancelledOrderDoc.paymentStatus !== "REFUNDED") {
    throw new Error(`TEST 7 FAILED: Order not marked CANCELLED/REFUNDED in DB`);
  }

  // Verify inventory is released back
  const productAfterCancel = await productsCol.findOne({ _id: testProduct._id });
  const invAfterCancel = await inventoriesCol.findOne({ product: testProduct._id });

  console.log(`  Product stock after cancel: Available = ${productAfterCancel.availableQuantity} (expected ${initialAvailableQty})`);
  console.log(`  Inventory stock after cancel: Reserved = ${invAfterCancel.reservedQuantity} (expected ${initialInvReserved}), Available = ${invAfterCancel.availableQuantity} (expected ${initialInvAvailable})`);

  if (productAfterCancel.availableQuantity !== initialAvailableQty) {
    throw new Error(`TEST 7 FAILED: Product availableQuantity not restored to initial value!`);
  }
  if (invAfterCancel.reservedQuantity !== initialInvReserved) {
    throw new Error(`TEST 7 FAILED: Inventory reservedQuantity not decremented back to initial!`);
  }

  // Also verify that CANCELLED cannot be transitioned to CONFIRMED (Terminal state check)
  const reTransitionRes = await fetch(`${BASE_URL}/api/orders/${createdOrderId}/status`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  if (reTransitionRes.status !== 400) {
    throw new Error(`TEST 7 FAILED: Cancelled order was allowed to change state!`);
  }
  console.log("✓ Terminal state enforcement verified: Cancelled order cannot transition to other states.");
  console.log("✓ TEST 7 PASSED: Order cancelled, payment marked REFUNDED, and inventory completely restocked!");

  // =========================================================================
  // TEST 8: NOTIFICATION ENGINE AUDIT
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 8: Notification Engine Audit");
  console.log("-------------------------------------------------------------------------------");

  const notificationsRes = await fetch(`${BASE_URL}/api/notifications`, { headers: authHeaders });
  const notifData = await notificationsRes.json();

  console.log("Notifications API Status:", notificationsRes.status);
  console.log(`Total user notifications found: ${notifData.notifications?.length || 0}`);

  if (notifData.notifications && notifData.notifications.length > 0) {
    const recentNotifs = notifData.notifications.slice(0, 3);
    for (const n of recentNotifs) {
      console.log(`  - [${n.type}] "${n.title}": ${n.message}`);
    }
  }

  const orderNotifCount = await notificationsCol.countDocuments({
    "metadata.orderId": new mongoose.Types.ObjectId(createdOrderId),
  });
  console.log(`✓ Database notification records for order #${testOrderNumber}: ${orderNotifCount}`);

  if (orderNotifCount < 2) {
    throw new Error("TEST 8 FAILED: Expected at least 2 notifications for order creation & cancellation.");
  }
  console.log("✓ TEST 8 PASSED: Lifecycle notifications verified in database!");

  console.log("\n===============================================================================");
  console.log("   🎉 ALL 8 / 8 PHASE 7 ENGINE TESTS PASSED WITH 100% INTEGRITY!");
  console.log("===============================================================================\n");

  await mongoose.disconnect();
}

runPhase7Tests().catch((err) => {
  console.error("\n❌ PHASE 7 TEST SUITE ERROR:", err);
  process.exit(1);
});
