import mongoose from "mongoose";
import crypto from "crypto";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/KISANOVA";
process.env.MONGODB_URI = MONGODB_URI;

// Set environment variables for test execution
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_kisanova_sample_id";
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "sample_razorpay_secret_key_123456";
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "sample_webhook_secret_abcdef987";
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;

console.log("=================================================");
console.log("   KISANDIRECT RAZORPAY 16-SCENARIO TEST SUITE   ");
console.log("=================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  [PASS] Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.\n");

  // Dynamically import project models and modules
  const { Order } = await import("../src/models/Order.ts");
  const { Product } = await import("../src/models/Product.ts");
  const { Category } = await import("../src/models/Category.ts");
  const { Inventory } = await import("../src/models/Inventory.ts");
  const { User } = await import("../src/models/User.ts");
  const { WebhookEvent } = await import("../src/models/WebhookEvent.ts");
  const {
    createRazorpayOrder,
    verifyPaymentSignature,
    generateTestPaymentSignature,
    verifyWebhookSignature,
    generateTestWebhookSignature,
    refundRazorpayPayment,
    RazorpayConfigError,
  } = await import("../src/lib/razorpay.ts");
  const {
    createOrder,
    confirmOrderPayment,
    failOrderPayment,
    releaseExpiredInventoryReservations,
    recordRefundRequest,
    confirmRefundCompleted,
  } = await import("../src/lib/order-engine.ts");

  // Setup test user
  let testBuyer = await User.findOne({ role: "CONSUMER" });
  if (!testBuyer) {
    testBuyer = await User.create({
      name: "Ramesh Sharma",
      email: `testbuyer_${Date.now()}@kisandirect.in`,
      phone: "9876543210",
      password: "password123",
      role: "CONSUMER",
      status: "ACTIVE",
    });
  }

  let testSeller = await User.findOne({ role: "FARMER" });
  if (!testSeller) {
    testSeller = await User.create({
      name: "Suresh Farmer",
      email: `testfarmer_${Date.now()}@kisandirect.in`,
      phone: "9876543211",
      password: "password123",
      role: "FARMER",
      status: "ACTIVE",
    });
  }

  let testCat = await Category.findOne();
  if (!testCat) {
    testCat = await Category.create({
      name: `Category-${Date.now()}`,
      slug: `cat-${Date.now()}`,
      description: "Produce category",
      isActive: true,
    });
  }

  let testProduct = await Product.findOne({ status: "AVAILABLE", availableQuantity: { $gt: 50 } });
  if (!testProduct) {
    testProduct = await Product.create({
      name: `Farm Fresh Tomatoes ${Date.now()}`,
      category: testCat._id,
      seller: testSeller._id,
      sellerType: "User",
      sellerName: testSeller.name,
      description: "Farm fresh vine tomatoes",
      availableQuantity: 200,
      minimumOrderQuantity: 1,
      unit: "kg",
      price: 45,
      status: "AVAILABLE",
      qualityGrade: "Grade A",
      harvestDate: new Date(),
      location: {
        district: "Cuttack",
        state: "Odisha",
        pincode: "753001",
      },
    });
  }

  // Ensure inventory record exists
  let testInventory = await Inventory.findOne({ product: testProduct._id });
  if (!testInventory) {
    testInventory = await Inventory.create({
      product: testProduct._id,
      farmer: testSeller._id,
      currentQuantity: testProduct.availableQuantity,
      reservedQuantity: 0,
      availableQuantity: testProduct.availableQuantity,
      unit: "kg",
      status: "AVAILABLE",
    });
  }

  console.log(`Using Test Buyer: ${testBuyer.name} (${testBuyer._id})`);
  console.log(`Using Test Product: ${testProduct.name} (Available: ${testProduct.availableQuantity} kg)\n`);

  // --- SCENARIO 1: Environment Variable Validation ---
  console.log("Scenario 1: Environment Variable Validation");
  try {
    const origKey = process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_ID;
    let caught = false;
    try {
      const { getRazorpayConfig } = await import("../src/lib/razorpay.ts");
      getRazorpayConfig();
    } catch (err) {
      caught = err instanceof RazorpayConfigError;
    }
    process.env.RAZORPAY_KEY_ID = origKey;
    assert(caught, "Missing RAZORPAY_KEY_ID throws specific RazorpayConfigError");
  } catch (e) {
    assert(false, "Scenario 1 failed: " + e.message);
  }

  // --- SCENARIO 2: Razorpay Order Creation returns valid order payload ---
  console.log("\nScenario 2: Razorpay Order Creation");
  const rzpOrder = await createRazorpayOrder({
    amountPaise: 50000, // 500 INR
    currency: "INR",
    receipt: "KD-TEST-001",
    notes: { test: "scenario_2" },
  });
  assert(
    rzpOrder && typeof rzpOrder.id === "string" && rzpOrder.amount === 50000 && rzpOrder.currency === "INR",
    "Razorpay order created with valid ID, 50000 paise, and INR currency"
  );

  // --- SCENARIO 3: Order DB Persistence in PENDING_PAYMENT & CREATED state ---
  console.log("\nScenario 3: Order DB Persistence in PENDING_PAYMENT");
  const initialStock = testProduct.availableQuantity;
  const orderResult = await createOrder({
    userId: testBuyer._id.toString(),
    items: [{ productId: testProduct._id.toString(), quantity: 10 }],
    deliveryAddress: {
      recipientName: "Ramesh Sharma",
      recipientPhone: "9876543210",
      addressLine: "Plot 10, Farm Lane",
      district: "Cuttack",
      state: "Odisha",
      pincode: "753001",
    },
    buyerType: "CONSUMER",
    paymentMethod: "UPI",
    isOnlinePayment: true,
    razorpayOrderId: rzpOrder.id,
  });
  const createdOrder = await Order.findById(orderResult.order._id);
  assert(
    createdOrder.orderStatus === "PENDING_PAYMENT" && createdOrder.paymentStatus === "CREATED",
    "Order saved with orderStatus='PENDING_PAYMENT' and paymentStatus='CREATED'"
  );

  // --- SCENARIO 4: Inventory Temporary Reservation with 15-Minute Expiry ---
  console.log("\nScenario 4: Temporary Inventory Reservation & TTL");
  const updatedProduct = await Product.findById(testProduct._id);
  const now = Date.now();
  const ttlMin = (createdOrder.inventoryReservationExpiresAt.getTime() - now) / (60 * 1000);
  assert(
    createdOrder.inventoryConsumed === false &&
    ttlMin >= 14 && ttlMin <= 16 &&
    updatedProduct.availableQuantity === initialStock - 10,
    `Stock temporarily reserved (${initialStock} -> ${updatedProduct.availableQuantity}) with ~15 min TTL (inventoryConsumed=false)`
  );

  // --- SCENARIO 5: Server-side Price Recalculation (Zero-Trust) ---
  console.log("\nScenario 5: Server-side Zero-Trust Price Recalculation");
  const expectedTotal = 10 * testProduct.price + (10 * testProduct.price >= 500 ? 0 : 40);
  assert(
    createdOrder.total === expectedTotal && createdOrder.subtotal === 10 * testProduct.price,
    `Server authoritative total calculation verified: ₹${createdOrder.total} (subtotal ₹${createdOrder.subtotal})`
  );

  // --- SCENARIO 6: Cryptographic HMAC SHA256 Signature Verification ---
  console.log("\nScenario 6: Cryptographic Signature Verification");
  const mockPaymentId = `pay_${Date.now()}_abc`;
  const validSignature = generateTestPaymentSignature(rzpOrder.id, mockPaymentId);
  const isSigValid = verifyPaymentSignature({
    razorpayOrderId: rzpOrder.id,
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: validSignature,
  });
  assert(isSigValid === true, "Cryptographic HMAC SHA256 signature verification passes for authentic signature");

  // --- SCENARIO 7: Invalid Signature Rejected ---
  console.log("\nScenario 7: Tampered Signature Rejected");
  const invalidSig = validSignature.slice(0, -4) + "dead";
  const isSigInvalid = verifyPaymentSignature({
    razorpayOrderId: rzpOrder.id,
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: invalidSig,
  });
  assert(isSigInvalid === false, "Tampered signature fails timingSafeEqual verification");

  // --- SCENARIO 8: Payment Confirmation & State Transition ---
  console.log("\nScenario 8: Order Confirmation upon Payment Verification");
  const confirmResult = await confirmOrderPayment({
    orderId: createdOrder._id.toString(),
    razorpayOrderId: rzpOrder.id,
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: validSignature,
    method: "UPI",
  });
  const confirmedOrder = await Order.findById(createdOrder._id);
  assert(
    confirmedOrder.orderStatus === "CONFIRMED" &&
    confirmedOrder.paymentStatus === "CAPTURED" &&
    confirmedOrder.inventoryConsumed === true &&
    confirmedOrder.inventoryReservationExpiresAt === undefined,
    "Order transitioned to CONFIRMED, CAPTURED, inventoryConsumed=true, and reservation TTL cleared"
  );

  // --- SCENARIO 9: Idempotency of Payment Confirmation ---
  console.log("\nScenario 9: Idempotency of Payment Confirmation");
  const stockBeforeRepeat = (await Product.findById(testProduct._id)).availableQuantity;
  const repeatConfirm = await confirmOrderPayment({
    orderId: createdOrder._id.toString(),
    razorpayOrderId: rzpOrder.id,
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: validSignature,
    method: "UPI",
  });
  const stockAfterRepeat = (await Product.findById(testProduct._id)).availableQuantity;
  assert(
    repeatConfirm.alreadyConfirmed === true && stockBeforeRepeat === stockAfterRepeat,
    "Second confirmation call returns alreadyConfirmed=true with zero duplicate inventory deduction"
  );

  // --- SCENARIO 10: Webhook Signature Verification ---
  console.log("\nScenario 10: Webhook Signature Verification");
  const testWebhookPayload = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: `pay_wh_${Date.now()}`,
          order_id: rzpOrder.id,
          amount: 50000,
          status: "captured",
          method: "upi",
        },
      },
    },
  });
  const validWebhookSig = generateTestWebhookSignature(testWebhookPayload);
  const isWhValid = verifyWebhookSignature({
    rawBody: testWebhookPayload,
    webhookSignature: validWebhookSig,
  });
  assert(isWhValid === true, "Authentic webhook signature on raw body verified");

  // --- SCENARIO 11: Webhook Rejection on Forged Signature ---
  console.log("\nScenario 11: Webhook Forged Signature Rejection");
  const isWhInvalid = verifyWebhookSignature({
    rawBody: testWebhookPayload,
    webhookSignature: "invalid_forged_webhook_sig_hex",
  });
  assert(isWhInvalid === false, "Forged webhook signature correctly rejected");

  // --- SCENARIO 12: Webhook Deduplication via WebhookEvent ---
  console.log("\nScenario 12: Webhook Deduplication");
  const testEventId = `evt_test_${Date.now()}`;
  await WebhookEvent.create({
    eventId: testEventId,
    eventType: "payment.captured",
    payloadSummary: { test: true },
    processedAt: new Date(),
  });
  const dupeEvent = await WebhookEvent.findOne({ eventId: testEventId });
  assert(dupeEvent !== null, "WebhookEvent records eventId for deduplication");

  // --- SCENARIO 13: Out-of-order Delivery Protection (No Downgrade) ---
  console.log("\nScenario 13: Protection Against Out-of-Order Failure Webhooks");
  const downgradeAttempt = await failOrderPayment({
    orderId: confirmedOrder._id.toString(),
    reason: "Late failure webhook arrived after payment was already confirmed",
  });
  const orderAfterAttempt = await Order.findById(confirmedOrder._id);
  assert(
    downgradeAttempt.success === false && orderAfterAttempt.orderStatus === "CONFIRMED",
    "Downgrade protection prevented CONFIRMED order from being downgraded to PAYMENT_FAILED"
  );

  // --- SCENARIO 14: Refund Request (Stage 1: CAPTURED -> REFUND_REQUESTED) ---
  console.log("\nScenario 14: Refund Request Flow");
  const mockRefundId = `rfnd_${Date.now()}`;
  const refundReqOrder = await recordRefundRequest({
    orderId: confirmedOrder._id.toString(),
    refundId: mockRefundId,
    refundAmount: confirmedOrder.total,
    reason: "Quality concern requested by customer",
  });
  assert(
    refundReqOrder.paymentStatus === "REFUND_REQUESTED" &&
    refundReqOrder.refundStatus === "REQUESTED" &&
    refundReqOrder.refundId === mockRefundId,
    "Refund requested: paymentStatus='REFUND_REQUESTED' and refundStatus='REQUESTED'"
  );

  // --- SCENARIO 15: Refund Confirmation (Stage 2: REFUNDED) ---
  console.log("\nScenario 15: Refund Completion Flow");
  const refundDoneOrder = await confirmRefundCompleted({
    refundId: mockRefundId,
    orderId: confirmedOrder._id.toString(),
    amount: confirmedOrder.total,
  });
  assert(
    refundDoneOrder.paymentStatus === "REFUNDED" &&
    refundDoneOrder.refundStatus === "PROCESSED" &&
    refundDoneOrder.refundCompletedAt instanceof Date,
    "Refund completed: paymentStatus='REFUNDED', refundStatus='PROCESSED', and refundCompletedAt recorded"
  );

  // --- SCENARIO 16: Automatic Expiry of Unpaid Inventory Reservations ---
  console.log("\nScenario 16: Automatic Expiry of Unpaid Reservations (> 15 mins)");
  // Create an unpaid order with expired reservation timestamp
  const stockBeforeExpiredOrder = (await Product.findById(testProduct._id)).availableQuantity;
  const expiredOrderRes = await createOrder({
    userId: testBuyer._id.toString(),
    items: [{ productId: testProduct._id.toString(), quantity: 5 }],
    deliveryAddress: {
      recipientName: "Test Expired",
      district: "Cuttack",
      state: "Odisha",
      pincode: "753001",
    },
    buyerType: "CONSUMER",
    paymentMethod: "UPI",
    isOnlinePayment: true,
  });
  // Manually backdate reservation timestamp to 20 minutes ago
  await Order.findByIdAndUpdate(expiredOrderRes.order._id, {
    $set: {
      inventoryReservationExpiresAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  });

  const releaseResult = await releaseExpiredInventoryReservations();
  const expiredOrderAfter = await Order.findById(expiredOrderRes.order._id);
  const stockAfterRelease = (await Product.findById(testProduct._id)).availableQuantity;

  assert(
    releaseResult.releasedCount >= 1 &&
    expiredOrderAfter.orderStatus === "PAYMENT_FAILED" &&
    stockAfterRelease === stockBeforeExpiredOrder,
    `Expired reservation detected and released: stock restored to ${stockAfterRelease} and order marked PAYMENT_FAILED`
  );

  console.log("\n=================================================");
  console.log(`   ALL ${passedCount} / ${totalCount} TESTS PASSED SUCCESSFULLY!   `);
  console.log("=================================================");

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error("\nTEST SUITE FAILED:", err);
  mongoose.disconnect();
  process.exit(1);
});
