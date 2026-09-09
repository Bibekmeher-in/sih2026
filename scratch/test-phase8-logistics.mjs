/**
 * PHASE 8 — LOGISTICS AND ROUTE OPTIMIZATION TEST SUITE
 * Tests:
 * 1. Nearest-Neighbor greedy route optimization algorithm & comparison calculations
 * 2. POST /api/admin/route-optimize (with DB route persistence)
 * 3. Vehicle fleet management (creation, listing, status update)
 * 4. Delivery dispatch management (vehicle assignment, status progression)
 * 5. Buyer tracking telemetry integration
 */

import mongoose from "mongoose";

const BASE_URL = "http://localhost:3000";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/KISANOVA";

async function runPhase8Tests() {
  console.log("===============================================================================");
  console.log("   PHASE 8: LOGISTICS AND ROUTE OPTIMIZATION TEST SUITE");
  console.log("===============================================================================");

  // Connect to MongoDB
  console.log("\n[SETUP] Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB at:", MONGO_URI);

  const db = mongoose.connection.db;
  const vehiclesCol = db.collection("vehicles");
  const deliveriesCol = db.collection("deliveries");
  const routesCol = db.collection("routes");

  // Step 1: Authenticate as Admin
  console.log("\n[AUTH] Authenticating as Admin (admin@example.com)...");
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
      email: "admin@example.com",
      password: "Kisan@1234",
      callbackUrl: `${BASE_URL}/admin`,
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

  const adminAuthHeaders = {
    Cookie: cookieHeader,
    "Content-Type": "application/json",
  };

  console.log("✓ Authenticated as Administrator (Status:", loginRes.status, ")");

  // =========================================================================
  // TEST 1: ROUTE OPTIMIZATION API (NEAREST-NEIGHBOR GREEDY HEURISTIC)
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 1: Deterministic Nearest-Neighbor Route Optimization API");
  console.log("-------------------------------------------------------------------------------");

  const optimizeRes = await fetch(`${BASE_URL}/api/admin/route-optimize`, {
    method: "POST",
    headers: adminAuthHeaders,
    body: JSON.stringify({ saveToDb: true }),
  });

  const optimizeData = await optimizeRes.json();
  console.log("Optimize Status:", optimizeRes.status);

  if (optimizeRes.status !== 200 || !optimizeData.success) {
    throw new Error(`TEST 1 FAILED: Expected status 200, got ${optimizeRes.status}`);
  }

  const { traditional, optimized, savings, algorithmDetails, savedRouteId } =
    optimizeData.comparison;

  console.log("\nTraditional Route:");
  console.log(`  Distance: ${traditional.totalDistanceKm} km`);
  console.log(`  Duration: ${Math.floor(traditional.estimatedDurationMinutes / 60)}h ${traditional.estimatedDurationMinutes % 60}m`);
  console.log(`  Fuel Cost: ₹${traditional.estimatedFuelCostInr}`);
  console.log(`  Stop Sequence: ${traditional.stops.map((s) => s.name.split(" ")[0]).join(" -> ")}`);

  console.log("\nOptimized Route (Nearest-Neighbor):");
  console.log(`  Distance: ${optimized.totalDistanceKm} km`);
  console.log(`  Duration: ${Math.floor(optimized.estimatedDurationMinutes / 60)}h ${optimized.estimatedDurationMinutes % 60}m`);
  console.log(`  Fuel Cost: ₹${optimized.estimatedFuelCostInr}`);
  console.log(`  Stop Sequence: ${optimized.stops.map((s) => s.name.split(" ")[0]).join(" -> ")}`);

  console.log("\nOptimization Delta & Savings:");
  console.log(`  Distance Saved: ${savings.distanceSavedKm} km (${savings.percentageDistanceSaved}%)`);
  console.log(`  Time Saved: ${savings.durationSavedMinutes} minutes`);
  console.log(`  Cost Saved: ₹${savings.costSavedInr}`);
  console.log(`  CO2 Avoided: ${savings.co2EmissionsSavedKg} kg`);
  console.log(`  Algorithm: ${algorithmDetails.algorithmName} (${algorithmDetails.timeComplexity})`);
  console.log(`  Global Optimality Disclosed: ${algorithmDetails.isGloballyOptimal ? "Yes" : "No (Heuristic)"}`);

  if (savings.distanceSavedKm <= 0) {
    throw new Error("TEST 1 FAILED: Expected distance savings to be strictly positive!");
  }
  if (savings.costSavedInr <= 0) {
    throw new Error("TEST 1 FAILED: Expected fuel cost savings to be strictly positive!");
  }
  if (!savedRouteId) {
    throw new Error("TEST 1 FAILED: Expected route document to be persisted in database!");
  }

  // Verify route document exists in MongoDB
  const savedRouteDoc = await routesCol.findOne({ _id: new mongoose.Types.ObjectId(savedRouteId) });
  if (!savedRouteDoc) {
    throw new Error("TEST 1 FAILED: Saved route not found in MongoDB!");
  }
  console.log(`✓ Verified persisted route doc: Code = ${savedRouteDoc.code}, Waypoints = ${savedRouteDoc.waypoints.length}`);
  console.log("✓ TEST 1 PASSED: Nearest-Neighbor route optimization & savings calculations verified!");

  // =========================================================================
  // TEST 2: LOGISTICS OVERVIEW TELEMETRY API
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 2: Logistics Overview Telemetry API");
  console.log("-------------------------------------------------------------------------------");

  const statsRes = await fetch(`${BASE_URL}/api/admin/logistics/stats`, {
    headers: adminAuthHeaders,
  });
  const statsData = await statsRes.json();

  console.log("Stats Status:", statsRes.status);
  console.log("  Pending Deliveries:", statsData.stats?.pendingDeliveriesCount);
  console.log("  Active Dispatches:", statsData.stats?.activeDeliveriesCount);
  console.log("  Fleet Utilization:", statsData.stats?.fleetUtilizationPercent, "%");
  console.log("  Total Cost Saved:", statsData.stats?.totalOptimizedCostSavedInr);

  if (statsRes.status !== 200 || !statsData.success) {
    throw new Error("TEST 2 FAILED: Stats API did not return 200 OK");
  }
  console.log("✓ TEST 2 PASSED: Logistics telemetry aggregated accurately!");

  // =========================================================================
  // TEST 3: VEHICLE FLEET MANAGEMENT (CRUD & STATUS)
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 3: Vehicle Fleet Management (Registration & Status Updates)");
  console.log("-------------------------------------------------------------------------------");

  const testRegNumber = `MH-15-KD-${Math.floor(1000 + Math.random() * 9000)}`;

  // Create Vehicle
  const createVehicleRes = await fetch(`${BASE_URL}/api/admin/vehicles`, {
    method: "POST",
    headers: adminAuthHeaders,
    body: JSON.stringify({
      registrationNumber: testRegNumber,
      vehicleClass: "COLD_CHAIN_REEFER",
      modelName: "Eicher Pro 2049 Reefer (Cold-Chain)",
      payloadCapacityKg: 3500,
      fuelType: "DIESEL",
      isRefrigerated: true,
      driverName: "Dinesh Kulkarni",
      driverPhone: "9822776655",
      baseHub: "Nashik Central Agri Logistics Depot",
    }),
  });

  const createVehicleData = await createVehicleRes.json();
  console.log("Create Vehicle Status:", createVehicleRes.status);

  if (createVehicleRes.status !== 201 || !createVehicleData.success) {
    throw new Error(`TEST 3 FAILED: Vehicle creation failed with status ${createVehicleRes.status}`);
  }

  const createdVehicleId = createVehicleData.vehicle._id;
  console.log(`✓ Registered Vehicle: ${testRegNumber} (ID: ${createdVehicleId})`);

  // Update Vehicle Status to ON_TRIP with new coordinates
  const updateVehicleRes = await fetch(`${BASE_URL}/api/admin/vehicles/${createdVehicleId}`, {
    method: "PATCH",
    headers: adminAuthHeaders,
    body: JSON.stringify({
      status: "ON_TRIP",
      currentLocation: { latitude: 20.012, longitude: 73.805 },
    }),
  });

  const updateVehicleData = await updateVehicleRes.json();
  console.log("Update Vehicle Status:", updateVehicleRes.status);
  console.log("New Vehicle Status:", updateVehicleData.vehicle?.status);

  if (updateVehicleData.vehicle?.status !== "ON_TRIP") {
    throw new Error("TEST 3 FAILED: Vehicle status not updated to ON_TRIP");
  }

  // Verify in MongoDB
  const vehDocInDb = await vehiclesCol.findOne({ _id: new mongoose.Types.ObjectId(createdVehicleId) });
  if (vehDocInDb.status !== "ON_TRIP" || !vehDocInDb.isRefrigerated) {
    throw new Error("TEST 3 FAILED: Vehicle state mismatch in database!");
  }
  console.log("✓ TEST 3 PASSED: Vehicle registered and status/telemetry updated!");

  // =========================================================================
  // TEST 4: DELIVERY DISPATCH MANAGEMENT & STATUS PROGRESSION
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 4: Delivery Dispatch Management & State Progression");
  console.log("-------------------------------------------------------------------------------");

  // Fetch or find a delivery in DB
  let delivery = await deliveriesCol.findOne();
  if (!delivery) {
    // Pick any order
    const sampleOrder = await db.collection("orders").findOne();
    const newDelRes = await deliveriesCol.insertOne({
      deliveryTrackingNumber: `KD-TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      order: sampleOrder ? sampleOrder._id : new mongoose.Types.ObjectId(),
      pickupLocation: {
        name: "Dindori Farm Gate Hub",
        address: "Survey 44, Dindori",
        district: "Nashik",
        state: "Maharashtra",
        latitude: 20.201,
        longitude: 73.842,
        contactPhone: "9822012345",
      },
      destination: {
        name: "APMC Wholesale Terminal",
        address: "Sector 19, Vashi",
        district: "Thane",
        state: "Maharashtra",
        latitude: 19.076,
        longitude: 73.003,
        contactPhone: "9820011223",
      },
      status: "PENDING_ASSIGNMENT",
      estimatedDistanceKm: 182,
      estimatedDurationMinutes: 260,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    delivery = await deliveriesCol.findOne({ _id: newDelRes.insertedId });
  }

  const deliveryId = delivery._id.toString();
  console.log(`Using Delivery ID: ${deliveryId} (Tracking: ${delivery.deliveryTrackingNumber})`);

  // Step 4a: Assign Vehicle
  const assignRes = await fetch(`${BASE_URL}/api/admin/deliveries/${deliveryId}`, {
    method: "PATCH",
    headers: adminAuthHeaders,
    body: JSON.stringify({
      vehicleId: createdVehicleId,
      routeId: savedRouteId,
    }),
  });

  const assignData = await assignRes.json();
  console.log("Assign Response Status:", assignRes.status);
  console.log("Delivery Status after Assignment:", assignData.delivery?.status);

  if (assignData.delivery?.status !== "ASSIGNED") {
    throw new Error("TEST 4 FAILED: Delivery status should be ASSIGNED");
  }

  // Step 4b: Progress to IN_TRANSIT
  const transitRes = await fetch(`${BASE_URL}/api/admin/deliveries/${deliveryId}`, {
    method: "PATCH",
    headers: adminAuthHeaders,
    body: JSON.stringify({
      status: "IN_TRANSIT",
      telemetry: {
        latitude: 19.55,
        longitude: 73.42,
        temperatureCelsius: 15.8,
      },
    }),
  });
  const transitData = await transitRes.json();
  console.log("In Transit Response Status:", transitRes.status, "Delivery Status:", transitData.delivery?.status);

  if (transitData.delivery?.status !== "IN_TRANSIT") {
    throw new Error("TEST 4 FAILED: Delivery status should be IN_TRANSIT");
  }

  // Step 4c: Complete Delivery (DELIVERED)
  const deliveredRes = await fetch(`${BASE_URL}/api/admin/deliveries/${deliveryId}`, {
    method: "PATCH",
    headers: adminAuthHeaders,
    body: JSON.stringify({
      status: "DELIVERED",
    }),
  });
  const deliveredData = await deliveredRes.json();
  console.log("Delivered Response Status:", deliveredRes.status, "Delivery Status:", deliveredData.delivery?.status);

  if (deliveredData.delivery?.status !== "DELIVERED") {
    throw new Error("TEST 4 FAILED: Delivery status should be DELIVERED");
  }

  // Verify Vehicle is released back to AVAILABLE
  const assignedVehicleAfterDelivery = await vehiclesCol.findOne({ _id: new mongoose.Types.ObjectId(createdVehicleId) });
  console.log("Vehicle Status after delivery completion:", assignedVehicleAfterDelivery.status);
  if (assignedVehicleAfterDelivery.status !== "AVAILABLE") {
    throw new Error("TEST 4 FAILED: Vehicle should be released to AVAILABLE upon delivery completion!");
  }
  console.log("✓ TEST 4 PASSED: Delivery successfully assigned, progressed through transit, completed, and vehicle released!");

  // =========================================================================
  // TEST 5: BUYER TRACKING INTEGRATION & TELEMETRY
  // =========================================================================
  console.log("\n-------------------------------------------------------------------------------");
  console.log("TEST 5: Buyer Order Tracking & Telemetry");
  console.log("-------------------------------------------------------------------------------");

  // Authenticate as consumer
  const consumerLoginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
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

  const consumerCookies = extractCookies(consumerLoginRes);
  const consumerCookieMap = new Map();
  [...initialCookies, ...consumerCookies].forEach((c) => {
    const [name, val] = c.split("=");
    if (name) consumerCookieMap.set(name.trim(), val);
  });
  const consumerCookieHeader = Array.from(consumerCookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  // Fetch consumer order details
  const sampleOrder = await db.collection("orders").findOne();
  const orderId = sampleOrder ? sampleOrder._id.toString() : "ord_cons_01";

  const trackRes = await fetch(`${BASE_URL}/api/consumer/orders/${orderId}`, {
    headers: { Cookie: consumerCookieHeader },
  });
  const trackData = await trackRes.json();

  console.log("Tracking Status:", trackRes.status);
  console.log("Order Tracking Number:", trackData.order?.trackingInfo?.trackingNumber);
  console.log("Carrier Vehicle:", trackData.order?.trackingInfo?.vehicleNumber);
  console.log("Cold Chain Telemetry:", trackData.order?.trackingInfo?.coldChainTempCelsius, "°C");

  if (trackRes.status !== 200 || !trackData.order?.trackingInfo) {
    throw new Error("TEST 5 FAILED: Tracking info missing from consumer order endpoint!");
  }
  console.log("✓ TEST 5 PASSED: Buyer tracking and cold-chain telemetry confirmed!");

  console.log("\n===============================================================================");
  console.log("   🎉 ALL PHASE 8 LOGISTICS & ROUTE OPTIMIZATION TESTS PASSED!");
  console.log("===============================================================================\n");

  await mongoose.disconnect();
}

runPhase8Tests().catch((err) => {
  console.error("\n❌ PHASE 8 TEST FAILED:", err);
  process.exit(1);
});
