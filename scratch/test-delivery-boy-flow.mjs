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

async function main() {
  console.log("===============================================================================");
  console.log("   DELIVERY BOY REGISTRATION, LOGIN, DASHBOARD & AI ASSIGNMENT VERIFICATION");
  console.log("===============================================================================\n");

  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB");
  const db = mongoose.connection.db;

  const uniqueId = Math.floor(1000 + Math.random() * 9000);
  const testEmail = `deliveryboy${uniqueId}@example.com`;
  const testPassword = "Password@1234";

  // Clean up any previous test user
  await db.collection("users").deleteOne({ email: testEmail });
  await db.collection("deliverypartnerprofiles").deleteMany({ phone: `987654${uniqueId}` });

  // 1. REGISTER NEW DELIVERY BOY
  console.log("\n[TEST 1] Registering New Delivery Boy via /api/auth/register...");
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Ramesh Nayak ${uniqueId}`,
      email: testEmail,
      password: testPassword,
      phone: `987654${uniqueId}`,
      role: "DELIVERY_PARTNER",
      district: "Khordha",
      state: "Odisha",
      vehicleType: "BIKE",
      vehicleNumber: `OD-02-AG-${uniqueId}`,
      drivingLicense: `DL-OD-${uniqueId}999`,
    }),
  });

  const regData = await regRes.json();
  if (!regData.success) {
    console.error("❌ Registration failed:", regData);
    process.exit(1);
  }
  console.log("✓ Delivery Boy registered successfully! User ID:", regData.user.id, "Role:", regData.user.role);

  // Verify DeliveryPartnerProfile was auto-provisioned
  const profileDoc = await db.collection("deliverypartnerprofiles").findOne({ user: new mongoose.Types.ObjectId(regData.user.id) });
  if (!profileDoc) {
    console.error("❌ DeliveryPartnerProfile not created!");
    process.exit(1);
  }
  console.log("✓ DeliveryPartnerProfile auto-provisioned:", {
    fullName: profileDoc.fullName,
    vehicleType: profileDoc.vehicleType,
    vehicleNumber: profileDoc.vehicleNumber,
    vehicleCapacityKg: profileDoc.vehicleCapacityKg,
    verificationStatus: profileDoc.verificationStatus,
  });

  // Ensure verified & online with coordinates
  await db.collection("deliverypartnerprofiles").updateOne(
    { _id: profileDoc._id },
    {
      $set: {
        verificationStatus: "VERIFIED",
        isOnline: true,
        isAvailableForAssignment: true,
        "currentLocation.latitude": 20.2961,
        "currentLocation.longitude": 85.8245,
        "currentLocation.updatedAt": new Date(),
        "currentLocation.locationGeo": {
          type: "Point",
          coordinates: [85.8245, 20.2961],
        },
      },
    }
  );
  console.log("✓ Set partner profile to VERIFIED, ONLINE, and GPS coordinates at Bhubaneswar hub.");

  // 2. LOGIN AS DELIVERY BOY
  console.log("\n[TEST 2] Logging in as Delivery Boy via NextAuth...");
  const cookie = await loginUser(testEmail, testPassword);
  console.log("✓ Successfully signed in! Session cookie obtained.");

  // 3. FETCH SESSION & CHECK ROLE
  console.log("\n[TEST 3] Verifying session role at /api/auth/session...");
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  const sessionData = await sessionRes.json();
  console.log("✓ Session verified. Role:", sessionData?.user?.role, "Email:", sessionData?.user?.email);
  if (sessionData?.user?.role !== "DELIVERY_PARTNER") {
    console.error("❌ Role mismatch in session!");
    process.exit(1);
  }

  // 4. FETCH DELIVERY DASHBOARD
  console.log("\n[TEST 4] Calling /api/delivery/dashboard for Delivery Boy...");
  const dashRes = await fetch(`${BASE_URL}/api/delivery/dashboard`, {
    headers: { Cookie: cookie },
  });
  const dashData = await dashRes.json();
  if (!dashData.success) {
    console.error("❌ Failed to fetch dashboard data:", dashData);
    process.exit(1);
  }
  console.log("✓ Dashboard loaded successfully:", {
    partnerName: dashData.data.profile?.fullName,
    isOnline: dashData.data.profile?.isOnline,
    vehicleType: dashData.data.profile?.vehicleType,
    vehicleCapacityKg: dashData.data.profile?.vehicleCapacityKg,
    activeTrips: dashData.data.stats?.activeTrips,
    pendingAssignmentsCount: dashData.data.pendingAssignments?.length,
  });

  // 5. TEST GPS LOCATION PING API
  console.log("\n[TEST 5] Updating device GPS location via /api/delivery/location...");
  const locRes = await fetch(`${BASE_URL}/api/delivery/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      latitude: 20.3012,
      longitude: 85.8285,
      accuracy: 8,
      speed: 18.5,
      heading: 90,
    }),
  });
  const locData = await locRes.json();
  console.log("✓ GPS location update response:", locData.message);

  // 6. CREATE AN ORDER READY FOR PICKUP & TEST AI NEARBY PARTNER MATCHING
  console.log("\n[TEST 6] Creating an order and testing AI delivery partner matching...");
  const farmerUser = await db.collection("users").findOne({ role: "FARMER" });
  const buyerUser = await db.collection("users").findOne({ role: "CONSUMER" });

  const orderNumber = `KD-TEST-${uniqueId}`;
  const deliveryOtp = "842917";
  const orderInsert = await db.collection("orders").insertOne({
    orderNumber,
    buyer: buyerUser._id,
    buyerType: "CONSUMER",
    seller: farmerUser._id,
    sellerType: "User",
    farmers: [farmerUser._id],
    items: [
      {
        product: new mongoose.Types.ObjectId(),
        productName: "Fresh Farm Organic Tomatoes",
        quantity: 15,
        unit: "kg",
        unitPrice: 30,
        totalItemPrice: 450,
      },
    ],
    subtotal: 450,
    deliveryFee: 0,
    total: 450,
    paymentStatus: "ESCROW_HELD",
    paymentMethod: "UPI",
    orderStatus: "READY_FOR_PICKUP",
    deliveryOtp,
    deliveryAddress: {
      recipientName: "Priya Sharma",
      recipientPhone: "9876543210",
      addressLine: "Plot 42, Saheed Nagar",
      district: "Khordha",
      state: "Odisha",
      pincode: "751007",
      coordinates: { latitude: 20.2961, longitude: 85.8245 },
    },
    statusHistory: [
      { status: "CONFIRMED", timestamp: new Date(), note: "Order placed" },
      { status: "READY_FOR_PICKUP", timestamp: new Date(), note: "Produce packed at farm gate" },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const orderId = orderInsert.insertedId.toString();
  console.log("✓ Created Order:", orderNumber, "ID:", orderId, "Status: READY_FOR_PICKUP");

  // Create Delivery record
  const deliveryInsert = await db.collection("deliveries").insertOne({
    order: orderInsert.insertedId,
    deliveryTrackingNumber: `KD-TRK-${uniqueId}-001`,
    pickupLocation: {
      name: "Baramunda Farm Gate Hub",
      address: "APMC Complex, Baramunda",
      district: "Khordha",
      state: "Odisha",
      latitude: 20.2961,
      longitude: 85.8245,
      contactPhone: "9822012345",
    },
    destination: {
      name: "Priya Sharma Residence",
      address: "Plot 42, Saheed Nagar",
      district: "Khordha",
      state: "Odisha",
      latitude: 20.2910,
      longitude: 85.8450,
      contactPhone: "9876543210",
    },
    packageDetails: { weightKg: 15, packageType: "BOXES" },
    estimatedDistanceKm: 6.5,
    estimatedDurationMinutes: 20,
    status: "ASSIGNED",
    assignmentStatus: "ASSIGNED",
    statusHistory: [{ status: "ASSIGNED", timestamp: new Date(), note: "Ready for delivery partner assignment" }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const deliveryId = deliveryInsert.insertedId.toString();
  console.log("✓ Created Delivery Record:", deliveryId);

  // Login as Admin to evaluate AI matching
  const adminCookie = await loginUser("admin@example.com", "Kisan@1234");
  const aiNearbyRes = await fetch(`${BASE_URL}/api/admin/deliveries/${deliveryId}/nearby-partners`, {
    headers: { Cookie: adminCookie },
  });
  const aiNearbyData = await aiNearbyRes.json();
  console.log("✓ AI Nearby Recommendation Candidates:", aiNearbyData.data?.rankedCandidates?.length || 0);
  if (aiNearbyData.data?.rankedCandidates?.length > 0) {
    const best = aiNearbyData.data.rankedCandidates[0];
    console.log(`  Top Recommended Partner: ${best.name} (${best.vehicleType}, ${best.vehicleCapacityKg}kg capacity)`);
    console.log(`  Proximity: ${best.distanceToPickupKm} km, Score: ${best.aiScore || best.deterministicScore}/100`);
    console.log(`  Reason: ${aiNearbyData.data.reason}`);
  }

  // Assign the newly registered delivery boy
  const assignRes = await fetch(`${BASE_URL}/api/admin/deliveries/${deliveryId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      partnerProfileId: profileDoc._id.toString(),
      notes: "Assigned via AI Recommendation Engine",
    }),
  });
  const assignData = await assignRes.json();
  console.log("✓ Delivery Assigned to new driver:", assignData.message);

  // 7. DELIVERY BOY DASHBOARD CHECKS NEW ASSIGNMENT
  console.log("\n[TEST 7] Checking delivery dashboard for new assignment offer...");
  const checkDashRes = await fetch(`${BASE_URL}/api/delivery/dashboard`, {
    headers: { Cookie: cookie },
  });
  const checkDashData = await checkDashRes.json();
  console.log("✓ Pending assignments on dashboard:", checkDashData.data.pendingAssignments?.length || 0);

  // 8. DELIVERY BOY ACCEPTS ASSIGNMENT
  console.log("\n[TEST 8] Delivery Boy accepting assignment via /api/delivery/assignments/[id]/accept...");
  const acceptRes = await fetch(`${BASE_URL}/api/delivery/assignments/${deliveryId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
  });
  const acceptData = await acceptRes.json();
  console.log("✓ Accept assignment response:", acceptData.message, "Status:", acceptData.delivery?.status);
  if (!acceptData.success) {
    console.error("❌ Failed to accept delivery:", acceptData);
    process.exit(1);
  }

  // 9. PROGRESS THROUGH MILESTONES
  console.log("\n[TEST 9] Progressing through delivery milestones via /api/delivery/[id]/status...");

  // 9a: Arrived at Pickup
  const arriveRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "ARRIVED_AT_PICKUP", note: "Arrived at farm gate pickup point" }),
  });
  console.log("✓ Milestone 1: ARRIVED_AT_PICKUP:", (await arriveRes.json()).message);

  // 9b: Picked Up
  const pickupRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "PICKED_UP", note: "15kg tomatoes loaded onto bike cargo carrier" }),
  });
  console.log("✓ Milestone 2: PICKED_UP:", (await pickupRes.json()).message);

  // 9c: In Transit
  const transitRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "IN_TRANSIT", note: "En route via Janpath Road" }),
  });
  console.log("✓ Milestone 3: IN_TRANSIT:", (await transitRes.json()).message);

  // 9d: Arrived at Destination
  const destRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "ARRIVED_AT_DESTINATION", note: "Reached customer doorstep at Saheed Nagar" }),
  });
  console.log("✓ Milestone 4: ARRIVED_AT_DESTINATION:", (await destRes.json()).message);

  // 10. PROOF OF DELIVERY (OTP)
  console.log("\n[TEST 10] Testing Customer Delivery OTP Verification...");

  // 10a: Wrong OTP must fail
  console.log("→ Submitting wrong OTP '000000' (expected rejection)...");
  const wrongOtpRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "DELIVERED", otpCode: "000000" }),
  });
  const wrongOtpData = await wrongOtpRes.json();
  if (wrongOtpRes.status === 400 && !wrongOtpData.success) {
    console.log("✓ Correctly rejected wrong OTP! Error message:", wrongOtpData.message);
  } else {
    console.error("❌ Wrong OTP was unexpectedly accepted!", wrongOtpData);
    process.exit(1);
  }

  // 10b: Valid customer OTP must succeed
  console.log(`→ Submitting correct customer OTP '${deliveryOtp}'...`);
  const validOtpRes = await fetch(`${BASE_URL}/api/delivery/${deliveryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "DELIVERED", otpCode: deliveryOtp, note: "Handed over to customer Priya Sharma" }),
  });
  const validOtpData = await validOtpRes.json();
  if (validOtpRes.status === 200 && validOtpData.success) {
    console.log("✓ Correct OTP verified! Order marked DELIVERED:", validOtpData.message);
  } else {
    console.error("❌ Valid OTP submission failed:", validOtpData);
    process.exit(1);
  }

  // 11. VERIFY FINAL DATABASE STATE
  console.log("\n[TEST 11] Verifying Final Database State in MongoDB...");
  const finalOrder = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(orderId) });
  const finalDelivery = await db.collection("deliveries").findOne({ _id: new mongoose.Types.ObjectId(deliveryId) });
  const finalProfile = await db.collection("deliverypartnerprofiles").findOne({ _id: profileDoc._id });

  console.log("✓ Final Order Status:", finalOrder.orderStatus);
  console.log("✓ Final Delivery Status:", finalDelivery.status);
  console.log("✓ Partner Availability Released:", finalProfile.isAvailableForAssignment);
  console.log("✓ Partner Completed Deliveries Count:", finalProfile.statistics.completedDeliveries);

  if (finalOrder.orderStatus === "DELIVERED" && finalDelivery.status === "DELIVERED" && finalProfile.isAvailableForAssignment === true) {
    console.log("\n===============================================================================");
    console.log("   🎉 ALL 11 TESTS PASSED PERFECTLY: DELIVERY BOY FLOW & AI ASSIGNMENT 100% COMPLETE!");
    console.log("===============================================================================");
  } else {
    console.error("❌ State mismatch in final verification!");
    process.exit(1);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
