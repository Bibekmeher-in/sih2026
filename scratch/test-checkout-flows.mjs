import mongoose from "mongoose";
import crypto from "crypto";
import fs from "fs";

// Load .env.local
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      process.env[k.trim()] = v.join("=").trim();
    }
  }
} catch (e) {
  // Ignore
}

const BASE_URL = "http://localhost:3000";
const MONGODB_URI = "mongodb://127.0.0.1:27017/KISANOVA";

async function runTests() {
  console.log("=== COMPREHENSIVE CHECKOUT FLOW VERIFICATION TESTS ===\n");

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // 1. Fetch test users and test product
  const consumerUser = await db.collection("users").findOne({ role: "CONSUMER" });
  const bulkBuyerUser = await db.collection("users").findOne({ role: "BULK_BUYER" });
  const product = await db.collection("products").findOne({ status: "AVAILABLE", availableQuantity: { $gt: 50 } });

  if (!consumerUser || !bulkBuyerUser || !product) {
    throw new Error("Missing test fixtures in database.");
  }

  console.log(`Test Consumer: ${consumerUser.name} (${consumerUser._id})`);
  console.log(`Test Bulk Buyer: ${bulkBuyerUser.name} (${bulkBuyerUser._id})`);
  console.log(`Test Product: ${product.name} (Stock: ${product.availableQuantity} ${product.unit}, Price: ₹${product.price})\n`);

  let testsPassed = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    } else {
      console.log(`✅ PASSED: ${message}`);
      testsPassed++;
    }
  }

  // TEST 1: Direct API Abuse Prevention on /api/orders
  console.log("\n--- TEST 1: Direct API Abuse Prevention (/api/orders) ---");
  const directAbuseRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": consumerUser._id.toString(),
    },
    body: JSON.stringify({
      items: [{ productId: product._id.toString(), quantity: 2 }],
      deliveryAddress: {
        recipientName: "Hacker Attempt",
        recipientPhone: "9999999999",
        addressLine: "Nowhere 123",
        district: "Pune",
        state: "Maharashtra",
        pincode: "411001",
      },
      paymentMethod: "UPI",
      autoConfirm: true,
    }),
  });
  const abuseData = await directAbuseRes.json();
  assert(
    directAbuseRes.status === 400,
    `Calling /api/orders directly with online paymentMethod (UPI) was rejected with HTTP 400 (Status: ${directAbuseRes.status})`
  );
  assert(
    abuseData.message.includes("Online payment orders must be initiated via /api/payments/create-order"),
    "Proper message directing client to /api/payments/create-order returned"
  );

  // TEST 2: Direct API Abuse Prevention on /api/consumer/orders
  console.log("\n--- TEST 2: Direct API Abuse Prevention (/api/consumer/orders) ---");
  const consumerAbuseRes = await fetch(`${BASE_URL}/api/consumer/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": consumerUser._id.toString(),
    },
    body: JSON.stringify({
      recipientName: "Consumer Tester",
      recipientPhone: "9822012345",
      addressLine: "Test Line 1",
      district: "Pune",
      state: "Maharashtra",
      pincode: "411038",
      paymentMethod: "UPI",
      items: [{ productId: product._id.toString(), quantity: 2 }],
    }),
  });
  assert(
    consumerAbuseRes.status === 500 || consumerAbuseRes.status === 400,
    `Calling /api/consumer/orders with online payment (UPI) was blocked (Status: ${consumerAbuseRes.status})`
  );

  // TEST 3: Direct API Abuse Prevention on /api/buyer/orders
  console.log("\n--- TEST 3: Direct API Abuse Prevention (/api/buyer/orders) ---");
  const buyerAbuseRes = await fetch(`${BASE_URL}/api/buyer/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": bulkBuyerUser._id.toString(),
    },
    body: JSON.stringify({
      items: [{ productId: product._id.toString(), quantity: 5 }],
      deliveryAddress: {
        recipientName: "Bulk Tester",
        recipientPhone: "9822012345",
        addressLine: "Warehouse 1",
        district: "Pune",
        state: "Maharashtra",
        pincode: "411028",
      },
      paymentMethod: "UPI",
    }),
  });
  assert(
    buyerAbuseRes.status === 400,
    `Calling /api/buyer/orders with online payment (UPI) was rejected with HTTP 400 (Status: ${buyerAbuseRes.status})`
  );

  // TEST 4: Cash on Delivery Flow (Consumer)
  console.log("\n--- TEST 4: Cash on Delivery Flow (Consumer) ---");
  const codRes = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": consumerUser._id.toString(),
    },
    body: JSON.stringify({
      items: [{ productId: product._id.toString(), quantity: 1 }],
      deliveryAddress: {
        recipientName: "COD Consumer",
        recipientPhone: "9822011111",
        addressLine: "House 5, Green Street",
        district: "Pune",
        state: "Maharashtra",
        pincode: "411038",
      },
      buyerType: "CONSUMER",
      paymentMethod: "CASH_ON_DELIVERY",
    }),
  });
  const codData = await codRes.json();
  assert(codRes.status === 201 && codData.success, "COD order created successfully via /api/orders");
  assert(codData.order.orderStatus === "CONFIRMED", "COD orderStatus is CONFIRMED immediately for logistics dispatch");
  assert(codData.order.paymentStatus === "PENDING", "COD paymentStatus is PENDING (not paid yet)");
  assert(codData.order.paymentMethod === "CASH_ON_DELIVERY", "COD paymentMethod is CASH_ON_DELIVERY");
  assert(!codData.order.razorpayOrderId, "No Razorpay order ID created for COD");

  // TEST 5: Cash on Delivery Flow (Bulk Buyer)
  console.log("\n--- TEST 5: Cash on Delivery Flow (Bulk Buyer) ---");
  const bulkCodRes = await fetch(`${BASE_URL}/api/buyer/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": bulkBuyerUser._id.toString(),
    },
    body: JSON.stringify({
      items: [{ productId: product._id.toString(), quantity: 2 }],
      deliveryAddress: {
        recipientName: "B2B Receiving Dock",
        recipientPhone: "9876543210",
        addressLine: "Plot 8, Agro Park",
        district: "Pune",
        state: "Maharashtra",
        pincode: "411028",
      },
      paymentMethod: "CASH_ON_DELIVERY",
    }),
  });
  const bulkCodData = await bulkCodRes.json();
  assert(bulkCodRes.status === 201 && bulkCodData.success, "Bulk Buyer COD order created successfully");
  assert(bulkCodData.order.orderStatus === "CONFIRMED", "Bulk Buyer COD orderStatus is CONFIRMED");
  assert(bulkCodData.order.paymentStatus === "PENDING", "Bulk Buyer COD paymentStatus is PENDING");

  // TEST 6: Consumer Online Payment Flow (NEVER confirmed before Razorpay verification)
  console.log("\n--- TEST 6: Consumer Online Payment Flow ---");
  const initOnlineRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": consumerUser._id.toString(),
    },
    body: JSON.stringify({
      items: [{ productId: product._id.toString(), quantity: 3 }],
      deliveryAddress: {
        recipientName: "Online Consumer",
        recipientPhone: "9822022222",
        addressLine: "Flat 101, Sunshine Apts",
        district: "Pune",
        state: "Maharashtra",
        pincode: "411038",
      },
      buyerType: "CONSUMER",
      paymentMethod: "UPI",
    }),
  });
  const initOnlineData = await initOnlineRes.json();
  assert(initOnlineRes.status === 200 && initOnlineData.success, "Payment session created via /api/payments/create-order");
  assert(Boolean(initOnlineData.razorpayOrderId), `Razorpay Order ID returned: ${initOnlineData.razorpayOrderId}`);
  assert(Boolean(initOnlineData.orderId), `Internal Order ID returned: ${initOnlineData.orderId}`);

  // CRITICAL CHECK: Inspect order directly in MongoDB before verification
  const preVerifyOrder = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(initOnlineData.orderId) });
  assert(
    preVerifyOrder.orderStatus === "PENDING_PAYMENT",
    `CRITICAL: Order status BEFORE payment verification is strictly PENDING_PAYMENT (Actual: ${preVerifyOrder.orderStatus})`
  );
  assert(
    preVerifyOrder.paymentStatus === "CREATED",
    `CRITICAL: Payment status BEFORE payment verification is strictly CREATED (Actual: ${preVerifyOrder.paymentStatus})`
  );
  assert(
    preVerifyOrder.inventoryConsumed === false,
    "CRITICAL: Inventory is reserved temporarily, NOT permanently consumed yet"
  );

  // TEST 7: Payment Dismissal & Retry Flow (Reuse pending order)
  console.log("\n--- TEST 7: Payment Dismissal & Retry Flow ---");
  // When user dismisses modal, client retries passing existingOrderId
  const retryOnlineRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": consumerUser._id.toString(),
    },
    body: JSON.stringify({
      items: [{ productId: product._id.toString(), quantity: 3 }],
      deliveryAddress: {
        recipientName: "Online Consumer",
        recipientPhone: "9822022222",
        addressLine: "Flat 101, Sunshine Apts",
        district: "Pune",
        state: "Maharashtra",
        pincode: "411038",
      },
      buyerType: "CONSUMER",
      paymentMethod: "UPI",
      existingOrderId: initOnlineData.orderId,
    }),
  });
  const retryOnlineData = await retryOnlineRes.json();
  assert(retryOnlineRes.status === 200 && retryOnlineData.success, "Payment session retry succeeded");
  assert(
    retryOnlineData.orderId === initOnlineData.orderId,
    `Existing PENDING_PAYMENT order reused without duplicate creation (${retryOnlineData.orderId} === ${initOnlineData.orderId})`
  );

  // TEST 8: Server-Side Signature Verification & Order Confirmation
  console.log("\n--- TEST 8: Server-Side Signature Verification & Confirmation ---");
  const testSecret = process.env.RAZORPAY_KEY_SECRET || "test_secret_for_local_dev_12345";
  const fakePaymentId = `pay_test_${Date.now().toString().slice(-8)}`;
  const validSignature = crypto
    .createHmac("sha256", testSecret)
    .update(`${retryOnlineData.razorpayOrderId}|${fakePaymentId}`)
    .digest("hex");

  const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": consumerUser._id.toString(),
    },
    body: JSON.stringify({
      orderId: retryOnlineData.orderId,
      razorpay_order_id: retryOnlineData.razorpayOrderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature,
      method: "UPI",
    }),
  });
  const verifyData = await verifyRes.json();
  assert(verifyRes.status === 200 && verifyData.success, "Server verified signature and completed confirmation");

  // Verify in MongoDB after verification
  const postVerifyOrder = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(retryOnlineData.orderId) });
  assert(
    postVerifyOrder.orderStatus === "CONFIRMED",
    `CRITICAL: Order status AFTER server-side verification is CONFIRMED (Actual: ${postVerifyOrder.orderStatus})`
  );
  assert(
    postVerifyOrder.paymentStatus === "CAPTURED",
    `CRITICAL: Payment status AFTER server-side verification is CAPTURED (Actual: ${postVerifyOrder.paymentStatus})`
  );
  assert(
    postVerifyOrder.inventoryConsumed === true,
    "CRITICAL: Inventory consumed permanently upon verified capture"
  );
  assert(
    postVerifyOrder.razorpayPaymentId === fakePaymentId,
    `Razorpay Payment ID stored accurately (${postVerifyOrder.razorpayPaymentId})`
  );

  // TEST 9: Duplicate Verification Idempotency
  console.log("\n--- TEST 9: Duplicate Verification Idempotency ---");
  const dupVerifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": consumerUser._id.toString(),
    },
    body: JSON.stringify({
      orderId: retryOnlineData.orderId,
      razorpay_order_id: retryOnlineData.razorpayOrderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature,
      method: "UPI",
    }),
  });
  const dupVerifyData = await dupVerifyRes.json();
  assert(
    dupVerifyRes.status === 200 && dupVerifyData.success,
    "Re-verifying already captured order returns 200 success idempotently"
  );
  assert(dupVerifyData.alreadyConfirmed === true, "Returned alreadyConfirmed: true without duplicate deduction");

  // TEST 10: Bulk Buyer Online Payment Flow
  console.log("\n--- TEST 10: Bulk Buyer Online Payment Flow ---");
  const bulkOnlineRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": bulkBuyerUser._id.toString(),
    },
    body: JSON.stringify({
      items: [{ productId: product._id.toString(), quantity: 10 }],
      deliveryAddress: {
        recipientName: "B2B Agro Foods Corp",
        recipientPhone: "9876500000",
        addressLine: "Warehouse B, Industrial Zone",
        district: "Pune",
        state: "Maharashtra",
        pincode: "411028",
      },
      buyerType: "BULK_BUYER",
      paymentMethod: "NET_BANKING",
    }),
  });
  const bulkOnlineData = await bulkOnlineRes.json();
  assert(bulkOnlineRes.status === 200 && bulkOnlineData.success, "Bulk Buyer payment session created via /api/payments/create-order");

  const bulkPreVerifyOrder = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(bulkOnlineData.orderId) });
  assert(
    bulkPreVerifyOrder.orderStatus === "PENDING_PAYMENT",
    `Bulk Buyer order status BEFORE payment verification is strictly PENDING_PAYMENT (Actual: ${bulkPreVerifyOrder.orderStatus})`
  );
  assert(
    bulkPreVerifyOrder.paymentStatus === "CREATED",
    `Bulk Buyer payment status BEFORE payment verification is strictly CREATED (Actual: ${bulkPreVerifyOrder.paymentStatus})`
  );

  const bulkPaymentId = `pay_bulk_${Date.now().toString().slice(-8)}`;
  const bulkSignature = crypto
    .createHmac("sha256", testSecret)
    .update(`${bulkOnlineData.razorpayOrderId}|${bulkPaymentId}`)
    .digest("hex");

  const bulkVerifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": bulkBuyerUser._id.toString(),
    },
    body: JSON.stringify({
      orderId: bulkOnlineData.orderId,
      razorpay_order_id: bulkOnlineData.razorpayOrderId,
      razorpay_payment_id: bulkPaymentId,
      razorpay_signature: bulkSignature,
      method: "NET_BANKING",
    }),
  });
  const bulkVerifyData = await bulkVerifyRes.json();
  assert(bulkVerifyRes.status === 200 && bulkVerifyData.success, "Bulk Buyer payment verified successfully");

  const bulkPostVerifyOrder = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(bulkOnlineData.orderId) });
  assert(
    bulkPostVerifyOrder.orderStatus === "CONFIRMED",
    `Bulk Buyer order status AFTER verification is CONFIRMED (Actual: ${bulkPostVerifyOrder.orderStatus})`
  );
  assert(
    bulkPostVerifyOrder.paymentStatus === "CAPTURED",
    `Bulk Buyer payment status AFTER verification is CAPTURED (Actual: ${bulkPostVerifyOrder.paymentStatus})`
  );

  // TEST 11: Invalid Signature Rejection on Unconfirmed Order
  console.log("\n--- TEST 11: Invalid Signature Rejection ---");
  const unconfirmedSessionRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": consumerUser._id.toString(),
    },
    body: JSON.stringify({
      items: [{ productId: product._id.toString(), quantity: 1 }],
      deliveryAddress: {
        recipientName: "Sig Tester",
        recipientPhone: "9822000000",
        addressLine: "Test Line 99",
        district: "Pune",
        state: "Maharashtra",
        pincode: "411038",
      },
      buyerType: "CONSUMER",
      paymentMethod: "UPI",
    }),
  });
  const unconfirmedSession = await unconfirmedSessionRes.json();

  const badVerifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user-id": consumerUser._id.toString(),
    },
    body: JSON.stringify({
      orderId: unconfirmedSession.orderId,
      razorpay_order_id: unconfirmedSession.razorpayOrderId,
      razorpay_payment_id: "pay_tampered_123",
      razorpay_signature: "invalid_hex_signature_abcdef123456",
      method: "UPI",
    }),
  });
  assert(badVerifyRes.status === 400, `Tampered signature was rejected with HTTP 400 (Status: ${badVerifyRes.status})`);

  // Verify that order remains PENDING_PAYMENT after failed signature verification
  const failedSigOrder = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(unconfirmedSession.orderId) });
  assert(
    failedSigOrder.orderStatus === "PENDING_PAYMENT" || failedSigOrder.orderStatus === "PAYMENT_FAILED",
    `Order status after invalid signature verification is NOT CONFIRMED (Actual: ${failedSigOrder.orderStatus})`
  );

  // TEST 12: Unauthorized User Verification Rejection
  console.log("\n--- TEST 12: Unauthorized User Order Verification Rejection ---");
  const anotherUser = await db.collection("users").findOne({ role: "FARMER" });
  if (anotherUser) {
    const unauthVerifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": anotherUser._id.toString(),
      },
      body: JSON.stringify({
        orderId: unconfirmedSession.orderId,
        razorpay_order_id: unconfirmedSession.razorpayOrderId,
        razorpay_payment_id: "pay_test_another_user",
        razorpay_signature: "any_sig",
        method: "UPI",
      }),
    });
    assert(unauthVerifyRes.status === 403, `Non-owner cannot verify another user's order (HTTP 403)`);
  }

  console.log(`\n========================================`);
  console.log(`ALL ${testsPassed} / ${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
