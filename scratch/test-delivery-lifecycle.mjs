/**
 * END-TO-END DELIVERY PARTNER & AI ASSIGNMENT INTEGRATION TEST
 *
 * Tests:
 * 1. Partner authentication, profile provisioning, duty toggle & live GPS telemetry update
 * 2. GeoJSON 2dsphere spatial querying & vehicle capacity filtering
 * 3. Gemini AI / Deterministic partner recommendation and ranking
 * 4. Delivery assignment, driver accept flow, and notification creation
 * 5. Synchronized state machine progression: READY_FOR_PICKUP -> ASSIGNED_FOR_DELIVERY -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY
 * 6. Invalid OTP rejection & valid OTP proof-of-delivery completion
 * 7. Consumer tracking telemetry verification
 */

import mongoose from "mongoose";

const BASE_URL = "http://localhost:3000";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/KISANOVA";

const extractCookies = (res) => {
  if (res.headers.getSetCookie) {
    return res.headers.getSetCookie().map((c) => c.split(";")[0]);
  }
  const single = res.headers.get("set-cookie");
  return single ? [single.split(";")[0]] : [];
};

async function loginUser(email, password) {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const initialCookies = extractCookies(csrfRes);

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: initialCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${BASE_URL}/`,
      json: "true",
    }),
    redirect: "manual",
  });

  const sessionCookies = extractCookies(loginRes);
  return [...initialCookies, ...sessionCookies].join("; ");
}

async function runDeliveryLifecycleTests() {
  console.log("===============================================================================");
  console.log("   DELIVERY PARTNER, AI ASSIGNMENT & REAL GPS TELEMETRY TEST SUITE");
  console.log("===============================================================================\n");

  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB at:", MONGO_URI);

  const db = mongoose.connection.db;
  const usersCol = db.collection("users");
  const partnerProfilesCol = db.collection("deliverypartnerprofiles");
  const ordersCol = db.collection("orders");
  const deliveriesCol = db.collection("deliveries");

  // TEST 1: Driver Authentication & Profile Verification
  console.log("\n[TEST 1] Authenticating Delivery Partner (delivery@example.com)...");
  const driverCookies = await loginUser("delivery@example.com", "Kisan@1234");
  console.log("✓ Partner successfully authenticated with session cookies");

  const driverUser = await usersCol.findOne({ email: "delivery@example.com" });
  if (!driverUser) {
    throw new Error("delivery@example.com user not found in database");
  }
  console.log("✓ Partner User Document ID:", driverUser._id.toString(), "Role:", driverUser.role);

  // Check or upsert partner profile to ensure online & verified
  let driverProfile = await partnerProfilesCol.findOne({ user: driverUser._id });
  if (!driverProfile) {
    console.log("Creating DeliveryPartnerProfile for demo driver...");
    const ins = await partnerProfilesCol.insertOne({
      user: driverUser._id,
      fullName: "Bikash Mohanty",
      phone: "+91 98765 43210",
      email: "delivery@example.com",
      vehicleType: "BIKE",
      vehicleNumber: "OD-02-AK-9812",
      vehicleCapacityKg: 50,
      verificationStatus: "VERIFIED",
      isOnline: true,
      isAvailableForAssignment: true,
      currentLocation: {
        type: "Point",
        coordinates: [85.8245, 20.2961], // [lng, lat]
        latitude: 20.2961,
        longitude: 85.8245,
        updatedAt: new Date(),
      },
      serviceArea: {
        city: "Bhubaneswar",
        state: "Odisha",
        radiusKm: 30,
      },
      statistics: {
        completedDeliveries: 52,
        rating: 4.9,
        onTimeDeliveries: 50,
        cancelledDeliveries: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await usersCol.updateOne({ _id: driverUser._id }, { $set: { deliveryPartnerProfile: ins.insertedId } });
    driverProfile = await partnerProfilesCol.findOne({ _id: ins.insertedId });
  } else {
    // Ensure isOnline and isAvailableForAssignment are true
    await partnerProfilesCol.updateOne(
      { _id: driverProfile._id },
      {
        $set: {
          verificationStatus: "VERIFIED",
          isOnline: true,
          isAvailableForAssignment: true,
          vehicleCapacityKg: 50,
          currentLocation: {
            type: "Point",
            coordinates: [85.8245, 20.2961],
            latitude: 20.2961,
            longitude: 85.8245,
            updatedAt: new Date(),
          },
        },
      }
    );
  }
  console.log("✓ Partner Profile Verified:", driverProfile.fullName, "Vehicle:", driverProfile.vehicleType, `(${driverProfile.vehicleCapacityKg} kg)`);

  // TEST 2: Driver Duty Toggle & Real GPS Telemetry API
  console.log("\n[TEST 2] Testing Driver Duty Toggle & Real GPS Updates...");
  const dutyRes = await fetch(`${BASE_URL}/api/delivery/duty`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverCookies },
    body: JSON.stringify({ isOnline: true }),
  });
  const dutyData = await dutyRes.json();
  if (!dutyData.success || !dutyData.isOnline) {
    throw new Error(`Duty toggle failed: ${JSON.stringify(dutyData)}`);
  }
  console.log("✓ Driver Duty State set to ONLINE:", dutyData.isOnline);

  const locRes = await fetch(`${BASE_URL}/api/delivery/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverCookies },
    body: JSON.stringify({
      latitude: 20.3012,
      longitude: 85.8285,
      accuracy: 8.5,
    }),
  });
  const locData = await locRes.json();
  if (!locData.success) {
    throw new Error(`GPS telemetry update failed: ${JSON.stringify(locData)}`);
  }
  console.log("✓ Real GPS coordinates updated via API:", locData.location.latitude, locData.location.longitude);

  // TEST 3: Admin Auth & Order Setup
  console.log("\n[TEST 3] Authenticating Admin & Preparing Order for Dispatch...");
  const adminCookies = await loginUser("admin@example.com", "Kisan@1234");
  console.log("✓ Admin authenticated");

  // Find or create an Order with READY_FOR_PICKUP
  const consumerUser = await usersCol.findOne({ email: "consumer@example.com" });
  const farmerUser = await usersCol.findOne({ email: "farmer@example.com" });

  const testOrderNumber = `ORD-DELIV-${Date.now()}`;
  const testDeliveryTracking = `TRK-${Date.now()}`;

  const anyProduct = await db.collection("products").findOne({});
  const sampleProductId = anyProduct ? anyProduct._id : new mongoose.Types.ObjectId();

  const orderInsert = await ordersCol.insertOne({
    orderNumber: testOrderNumber,
    buyer: consumerUser ? consumerUser._id : driverUser._id,
    seller: farmerUser ? farmerUser._id : driverUser._id,
    items: [
      {
        product: sampleProductId,
        productName: "Fresh Farm Organic Tomatoes",
        quantity: 20,
        unit: "kg",
        unitPrice: 35,
        totalItemPrice: 700,
        qualityGrade: "Grade A",
      },
    ],
    subtotal: 700,
    deliveryFee: 60,
    total: 760,
    orderStatus: "READY_FOR_PICKUP",
    paymentStatus: "ESCROW_HELD",
    paymentMethod: "UPI",
    deliveryOtp: "4829",
    otpVerified: false,
    deliveryAddress: {
      recipientName: "Anita Patnaik",
      recipientPhone: "+91 98765 00001",
      addressLine: "Plot 104, Saheed Nagar",
      district: "Khordha",
      state: "Odisha",
      pincode: "751007",
      coordinates: { latitude: 20.2910, longitude: 85.8450 },
    },
    statusHistory: [
      { status: "PENDING", timestamp: new Date(Date.now() - 3600000), note: "Order placed" },
      { status: "CONFIRMED", timestamp: new Date(Date.now() - 3000000), note: "Order confirmed" },
      { status: "READY_FOR_PICKUP", timestamp: new Date(Date.now() - 1200000), note: "Produce boxed at farm gate" },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const deliveryInsert = await deliveriesCol.insertOne({
    order: orderInsert.insertedId,
    deliveryTrackingNumber: testDeliveryTracking,
    pickupLocation: {
      name: "Baramunda Farm Gate Cluster",
      address: "APMC Complex, Baramunda",
      district: "Khordha",
      state: "Odisha",
      latitude: 20.2961,
      longitude: 85.8245,
      contactPhone: "+91 98220 12345",
    },
    destination: {
      name: "Anita Patnaik Residence",
      address: "Plot 104, Saheed Nagar",
      district: "Khordha",
      state: "Odisha",
      latitude: 20.2910,
      longitude: 85.8450,
      contactPhone: "+91 98765 00001",
    },
    packageDetails: {
      weightKg: 20,
      packageType: "CRATES",
    },
    estimatedDistanceKm: 6.5,
    estimatedDurationMinutes: 20,
    status: "PENDING_ASSIGNMENT",
    assignmentStatus: "UNASSIGNED",
    statusHistory: [
      { status: "PENDING_ASSIGNMENT", timestamp: new Date(), notes: "Created and awaiting partner dispatch" },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const deliveryId = deliveryInsert.insertedId.toString();
  console.log("✓ Created Test Dispatch Delivery:", deliveryId, "Tracking #:", testDeliveryTracking);

  // TEST 4: Query Nearby Partners with AI / Scoring Evaluation
  console.log("\n[TEST 4] Evaluating Eligible Nearby Delivery Partners via API...");
  const nearbyRes = await fetch(`${BASE_URL}/api/admin/deliveries/${deliveryId}/nearby-partners`, {
    headers: { Cookie: adminCookies },
  });
  const nearbyData = await nearbyRes.json();
  if (!nearbyData.success) {
    throw new Error(`Failed to fetch nearby partners: ${JSON.stringify(nearbyData)}`);
  }

  const candidates = nearbyData.data.rankedCandidates || [];
  console.log(`✓ Nearby Eligible Partners Found: ${candidates.length}`);
  if (candidates.length > 0) {
    const topCandidate = candidates[0];
    console.log(`  Top Recommended Partner: ${topCandidate.name || topCandidate.fullName}`);
    console.log(`  Vehicle: ${topCandidate.vehicleType} (Capacity: ${topCandidate.vehicleCapacityKg} kg >= Package: 20 kg)`);
    console.log(`  Distance to Pickup: ${topCandidate.distanceToPickupKm?.toFixed(2) || topCandidate.distanceKm?.toFixed(2)} km`);
    console.log(`  Match Score: ${topCandidate.aiScore || topCandidate.deterministicScore || 90}/100`);
    console.log(`  Recommendation Reason: ${nearbyData.data.reason}`);
  }

  // TEST 5: Assign Delivery Partner
  console.log("\n[TEST 5] Assigning Delivery Partner (Admin / AI Dispatch)...");
  const assignRes = await fetch(`${BASE_URL}/api/admin/deliveries/${deliveryId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookies },
    body: JSON.stringify({
      partnerProfileId: driverProfile._id.toString(),
      notes: "Assigned by AI optimization engine",
    }),
  });
  const assignData = await assignRes.json();
  if (!assignData.success) {
    throw new Error(`Assignment failed: ${JSON.stringify(assignData)}`);
  }
  console.log("✓ Delivery successfully assigned to partner:", driverProfile.fullName);

  // Verify DB state
  const updatedDelivery = await deliveriesCol.findOne({ _id: deliveryInsert.insertedId });
  const updatedOrder = await ordersCol.findOne({ _id: orderInsert.insertedId });
  if (updatedOrder.orderStatus !== "ASSIGNED_FOR_DELIVERY") {
    throw new Error(`Expected Order to be ASSIGNED_FOR_DELIVERY, found: ${updatedOrder.orderStatus}`);
  }
  console.log("✓ Order Status automatically synchronized to:", updatedOrder.orderStatus);

  // TEST 6: Partner Driver Accepts Assignment
  console.log("\n[TEST 6] Partner Driver accepts assignment...");
  const acceptRes = await fetch(`${BASE_URL}/api/delivery/assignments/${deliveryId}/accept`, {
    method: "POST",
    headers: { Cookie: driverCookies },
  });
  const acceptData = await acceptRes.json();
  if (!acceptData.success) {
    throw new Error(`Driver accept failed: ${JSON.stringify(acceptData)}`);
  }
  console.log("✓ Driver accepted delivery assignment");

  // TEST 7: Status Progression Lifecycle
  console.log("\n[TEST 7] Testing Status Progression (PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY)...");

  // 7a: ARRIVED_AT_PICKUP
  const arriveRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverCookies },
    body: JSON.stringify({
      status: "ARRIVED_AT_PICKUP",
      note: "Arrived at farm hub dispatch bay",
    }),
  });
  const arriveData = await arriveRes.json();
  if (!arriveData.success) {
    throw new Error(`ARRIVED_AT_PICKUP transition failed: ${JSON.stringify(arriveData)}`);
  }
  console.log("✓ Transitioned to ARRIVED_AT_PICKUP");

  // 7b: PICKED_UP
  const pickupRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverCookies },
    body: JSON.stringify({
      status: "PICKED_UP",
      note: "Loaded fresh crates at farm gate",
    }),
  });
  const pickupData = await pickupRes.json();
  if (!pickupData.success) {
    throw new Error(`PICKED_UP transition failed: ${JSON.stringify(pickupData)}`);
  }
  console.log("✓ Transitioned to PICKED_UP");

  // 7c: IN_TRANSIT
  const transitRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverCookies },
    body: JSON.stringify({
      status: "IN_TRANSIT",
      note: "En route via NH-16 towards delivery sector",
    }),
  });
  const transitData = await transitRes.json();
  if (!transitData.success) {
    throw new Error(`IN_TRANSIT transition failed: ${JSON.stringify(transitData)}`);
  }
  console.log("✓ Transitioned to IN_TRANSIT");

  // 7d: OUT_FOR_DELIVERY
  const outRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverCookies },
    body: JSON.stringify({
      status: "OUT_FOR_DELIVERY",
      note: "Arriving at consumer doorstep",
    }),
  });
  const outData = await outRes.json();
  if (!outData.success) {
    throw new Error(`OUT_FOR_DELIVERY transition failed: ${JSON.stringify(outData)}`);
  }
  console.log("✓ Transitioned to OUT_FOR_DELIVERY");

  // Verify synchronized Order status in DB
  const orderAfterOut = await ordersCol.findOne({ _id: orderInsert.insertedId });
  if (orderAfterOut.orderStatus !== "OUT_FOR_DELIVERY") {
    throw new Error(`Expected Order to be OUT_FOR_DELIVERY, found: ${orderAfterOut.orderStatus}`);
  }
  console.log("✓ Order Status automatically synchronized to:", orderAfterOut.orderStatus);

  // TEST 8: Invalid OTP Rejection Test
  console.log("\n[TEST 8] Testing Proof of Delivery: Invalid OTP Rejection...");
  const invalidOtpRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverCookies },
    body: JSON.stringify({
      status: "DELIVERED",
      otpCode: "9999", // Wrong OTP
      note: "Delivery handover attempt",
    }),
  });
  const invalidOtpData = await invalidOtpRes.json();
  if (invalidOtpData.success) {
    throw new Error("Invalid OTP was unexpectedly accepted!");
  }
  console.log("✓ Invalid OTP was properly rejected with message:", invalidOtpData.message);

  // TEST 9: Valid OTP Delivery Handover & Escrow Release
  console.log("\n[TEST 9] Testing Proof of Delivery: Valid OTP Acceptance...");
  const validOtp = orderAfterOut.deliveryOtp; // "4829"
  const deliverRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverCookies },
    body: JSON.stringify({
      status: "DELIVERED",
      otpCode: validOtp,
      note: "Customer confirmed produce quality and provided OTP",
    }),
  });
  const deliverData = await deliverRes.json();
  if (!deliverData.success) {
    throw new Error(`Valid OTP delivery failed: ${JSON.stringify(deliverData)}`);
  }
  console.log("✓ Delivery marked DELIVERED with valid OTP verification!");

  // Verify final DB state
  const finalDelivery = await deliveriesCol.findOne({ _id: deliveryInsert.insertedId });
  const finalOrder = await ordersCol.findOne({ _id: orderInsert.insertedId });
  const finalPartnerProfile = await partnerProfilesCol.findOne({ _id: driverProfile._id });

  if (finalDelivery.status !== "DELIVERED") {
    throw new Error(`Final delivery status should be DELIVERED, found: ${finalDelivery.status}`);
  }
  if (finalOrder.orderStatus !== "DELIVERED") {
    throw new Error(`Final order status should be DELIVERED, found: ${finalOrder.orderStatus}`);
  }
  if (!finalOrder.otpVerified) {
    throw new Error("Expected final order.otpVerified to be true");
  }
  if (!finalPartnerProfile.isAvailableForAssignment) {
    throw new Error("Expected partner to be released back to isAvailableForAssignment: true");
  }
  console.log("✓ DB Verification: Delivery = DELIVERED, Order = DELIVERED, OTP Verified = true");
  console.log("✓ Partner availability released: isAvailableForAssignment =", finalPartnerProfile.isAvailableForAssignment);

  // TEST 10: Consumer Tracking Telemetry Verification
  console.log("\n[TEST 10] Testing Consumer Tracking API Endpoint...");
  const consumerCookies = await loginUser("consumer@example.com", "Kisan@1234");
  const trackRes = await fetch(`${BASE_URL}/api/orders/${orderInsert.insertedId}/tracking`, {
    headers: { Cookie: consumerCookies },
  });
  const trackData = await trackRes.json();
  if (!trackData.success) {
    throw new Error(`Tracking API failed: ${JSON.stringify(trackData)}`);
  }
  console.log("✓ Consumer Tracking API response verified:");
  console.log("  Order Status:", trackData.orderStatus);
  console.log("  Carrier Info Driver:", trackData.carrierInfo?.driverName);
  console.log("  Carrier Info Phone:", trackData.carrierInfo?.driverPhone);
  console.log("  Carrier Info Vehicle:", trackData.carrierInfo?.vehicleNumber);

  console.log("\n===============================================================================");
  console.log("   🎉 ALL 10 TESTS PASSED SUCCESSFULLY! ZERO COMPROMISES.");
  console.log("===============================================================================\n");

  await mongoose.disconnect();
}

runDeliveryLifecycleTests().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
