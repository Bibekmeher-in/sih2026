import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import {
  User,
  FarmerProfile,
  FPO,
  BuyerProfile,
  Category,
  Product,
  Inventory,
  Order,
  Delivery,
  Vehicle,
  Route,
  DemandForecast,
  PriceRecommendation,
  Notification,
  Review,
} from "@/models";
import { DEMO_ACCOUNTS } from "@/config/demo-users";
import { USER_ROLES, USER_STATUSES } from "@/types";

export interface SeedSummary {
  categories: number;
  users: number;
  farmerProfiles: number;
  fpos: number;
  buyerProfiles: number;
  vehicles: number;
  routes: number;
  products: number;
  inventories: number;
  orders: number;
  deliveries: number;
  demandForecasts: number;
  priceRecommendations: number;
  reviews: number;
  notifications: number;
}

export async function seedCompleteDatabase(): Promise<SeedSummary> {
  await connectToDatabase();

  // 1. Categories
  const categoriesData = [
    {
      name: "Fresh Vegetables",
      slug: "vegetables",
      description: "Direct farm-harvested green, root, and table vegetables",
      icon: "Carrot",
    },
    {
      name: "Fresh Fruits",
      slug: "fruits",
      description: "Orchard-fresh seasonal and tropical Indian fruits",
      icon: "Apple",
    },
    {
      name: "Grains & Cereals",
      slug: "grains-cereals",
      description: "Basmati paddy, wheat, maize, and millets directly from growers",
      icon: "Wheat",
    },
    {
      name: "Spices & Condiments",
      slug: "spices",
      description: "Authentic dried chillies, turmeric, coriander, and seeds",
      icon: "Flame",
    },
    {
      name: "Pulses & Lentils",
      slug: "pulses",
      description: "Protein-rich arhar, chana, moong, and urad dals",
      icon: "CircleDot",
    },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      cat,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    categoryMap.set(cat.slug, doc._id.toString());
  }

  // 2. Users & Base Profiles
  const userMap = new Map<string, string>();
  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    const u = await User.findOneAndUpdate(
      { email: account.email.toLowerCase() },
      {
        name: account.name,
        email: account.email.toLowerCase(),
        passwordHash,
        role: account.role,
        phone: account.phone,
        status: USER_STATUSES.ACTIVE,
        location: account.location,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    userMap.set(account.role, u._id.toString());
  }

  const farmerUserId = userMap.get(USER_ROLES.FARMER)!;
  const fpoUserId = userMap.get(USER_ROLES.FPO)!;
  const buyerUserId = userMap.get(USER_ROLES.BULK_BUYER)!;
  const consumerUserId = userMap.get(USER_ROLES.CONSUMER)!;

  // 3. FarmerProfile — Ramesh Kumar
  const farmerProfile = await FarmerProfile.findOneAndUpdate(
    { user: farmerUserId },
    {
      user: farmerUserId,
      farmName: "Kumar Organic Horticulture Farm",
      landAreaAcres: 8.5,
      irrigationType: "Drip Irrigation",
      primaryCrops: ["Tomato", "Potato", "Cauliflower"],
      soilType: "Alluvial Riverbed Soil",
      kisanCreditCardNumber: "KCC-ODI-2024-9182",
      aadhaarVerified: true,
      bankDetails: {
        accountName: "Ramesh Kumar",
        accountNumber: "50100239485123",
        ifscCode: "SBIN0001234",
        bankName: "State Bank of India Cuttack",
      },
      coordinates: { latitude: 20.4625, longitude: 85.8828 },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  // 4. FPO — Odisha Farmers Producer Organization
  const fpo = await FPO.findOneAndUpdate(
    { user: fpoUserId },
    {
      user: fpoUserId,
      organizationName: "Odisha Farmers Producer Organization",
      registrationNumber: "CIN-U01100OR2019PTC031245",
      yearOfEstablishment: 2019,
      memberFarmerCount: 480,
      cropSpecialization: ["Table Tomato", "Sukinda Onion", "Swarna Rice", "Snowball Cauliflower"],
      annualTurnoverLakhs: 420,
      aggregationCenters: [
        {
          name: "Baramunda Central Aggregation Hub",
          address: "APMC Complex, Baramunda",
          district: "Khordha",
          state: "Odisha",
          pincode: "751003",
          contactPerson: "Santosh Mohapatra",
          contactPhone: "9823023456",
          latitude: 20.2961,
          longitude: 85.8245,
          coldStorageAvailable: true,
        },
      ],
      bankDetails: {
        accountName: "Odisha Farmers Producer Organization Ltd.",
        accountNumber: "023405001290",
        ifscCode: "ICIC0000234",
        bankName: "ICICI Bank Bhubaneswar",
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  // 5. BuyerProfiles
  await BuyerProfile.findOneAndUpdate(
    { user: buyerUserId },
    {
      user: buyerUserId,
      companyName: "Bhubaneswar Fresh Foods",
      buyerType: "PROCESSOR",
      gstin: "21AABCB9823P1Z4",
      fssaiNumber: "10019022009841",
      preferredPaymentTerms: "ON_DELIVERY",
      monthlyProcurementVolumeTonnes: 85,
      deliveryHubs: [
        {
          name: "Bhubaneswar Central Distribution Depot",
          address: "Infocity Industrial Estate, Patia",
          district: "Khordha",
          state: "Odisha",
          pincode: "751024",
          latitude: 20.3541,
          longitude: 85.8172,
        },
      ],
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  await BuyerProfile.findOneAndUpdate(
    { user: consumerUserId },
    {
      user: consumerUserId,
      companyName: "Demo Consumer (Direct Household)",
      buyerType: "CONSUMER",
      preferredPaymentTerms: "ON_DELIVERY",
      monthlyProcurementVolumeTonnes: 0.05,
      deliveryHubs: [
        {
          name: "Home Residence",
          address: "Flat 302, Niladri Vihar, Chandrasekharpur",
          district: "Khordha",
          state: "Odisha",
          pincode: "751003",
          latitude: 20.3215,
          longitude: 85.8201,
        },
      ],
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  // Update user profile references
  await User.findByIdAndUpdate(farmerUserId, { farmerProfile: farmerProfile._id });
  await User.findByIdAndUpdate(fpoUserId, { fpoProfile: fpo._id });

  // 6. Vehicles
  const vehiclesData = [
    {
      registrationNumber: "OD-05-AB-1234",
      vehicleClass: "TATA_ACE" as const,
      modelName: "Tata Ace Gold Plus (1.2T)",
      payloadCapacityKg: 1200,
      fuelType: "CNG" as const,
      isRefrigerated: false,
      driverName: "Balaram Sahoo",
      driverPhone: "9822991122",
      status: "AVAILABLE" as const,
      baseHub: "Cuttack Farm Aggregation Hub",
      currentLocation: { latitude: 20.4625, longitude: 85.8828, lastReportedAt: new Date() },
    },
    {
      registrationNumber: "OD-02-CD-5678",
      vehicleClass: "EICHER_407" as const,
      modelName: "Eicher Pro 2049 Reefer (3.5T)",
      payloadCapacityKg: 3500,
      fuelType: "DIESEL" as const,
      isRefrigerated: true,
      driverName: "Prasant Nayak",
      driverPhone: "9822993344",
      status: "ON_TRIP" as const,
      baseHub: "Baramunda Central Cold Storage Terminal",
      currentLocation: { latitude: 20.35, longitude: 85.82, lastReportedAt: new Date() },
    },
    {
      registrationNumber: "OD-33-EF-9012",
      vehicleClass: "MEDIUM_TRUCK" as const,
      modelName: "BharatBenz 1217C (8.5T)",
      payloadCapacityKg: 8500,
      fuelType: "DIESEL" as const,
      isRefrigerated: false,
      driverName: "Bikash Jena",
      driverPhone: "9814002233",
      status: "AVAILABLE" as const,
      baseHub: "Baramunda Central Cold Storage Terminal",
      currentLocation: { latitude: 20.2961, longitude: 85.8245, lastReportedAt: new Date() },
    },
  ];

  const vehicleMap = new Map<string, string>();
  for (const v of vehiclesData) {
    const doc = await Vehicle.findOneAndUpdate(
      { registrationNumber: v.registrationNumber },
      v,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    vehicleMap.set(v.registrationNumber, doc._id.toString());
  }

  // 7. Routes
  const routesData = [
    {
      name: "Cuttack Farm Cluster -> Bhubaneswar APMC Highway Corridor",
      code: "ROUTE-CTC-BBS-01",
      originHub: "Cuttack Rural Aggregation Hub",
      destinationHub: "Bhubaneswar APMC Terminal",
      distanceKm: 38.5,
      estimatedDurationMinutes: 55,
      roadQuality: "EXPRESSWAY" as const,
      waypoints: [
        {
          name: "Athagarh Farmer Pickup Cluster",
          sequence: 1,
          latitude: 20.5182,
          longitude: 85.7865,
          stopType: "FARM_GATE" as const,
          estimatedStopMinutes: 25,
        },
        {
          name: "Choudwar Aggregation Depot",
          sequence: 2,
          latitude: 20.5298,
          longitude: 85.9124,
          stopType: "FPO_HUB" as const,
          estimatedStopMinutes: 20,
        },
      ],
    },
  ];

  const routeMap = new Map<string, string>();
  for (const r of routesData) {
    const doc = await Route.findOneAndUpdate(
      { code: r.code },
      r,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    routeMap.set(r.code, doc._id.toString());
  }

  // 8. Products — Specifically Tomato, Potato, Onion, Rice, Cauliflower
  const vegCatId = categoryMap.get("vegetables")!;
  const grainsCatId = categoryMap.get("grains-cereals")!;

  const productsData = [
    {
      name: "Hybrid Red Table Tomato",
      hindiName: "Tamatar",
      variety: "Abhinav 1057",
      seller: farmerUserId,
      sellerType: "User" as const,
      sellerName: "Ramesh Kumar",
      category: vegCatId,
      description: "Uniform deep red color, firm pulp with high brix sweetness. Harvested at pink stage for maximum transit shelf life.",
      price: 24,
      mandiBenchmarkPrice: 16,
      unit: "kg" as const,
      availableQuantity: 10500,
      minimumOrderQuantity: 10,
      qualityGrade: "Grade A" as const,
      harvestDate: new Date(Date.now() - 24 * 3600 * 1000),
      location: { district: "Cuttack", state: "Odisha", pincode: "753001", coordinates: { latitude: 20.4625, longitude: 85.8828 } },
      images: ["/crops/tomato.jpg"],
      status: "AVAILABLE" as const,
    },
    {
      name: "Kufri Jyoti Table Potato",
      hindiName: "Aloo",
      variety: "Kufri Jyoti",
      seller: farmerUserId,
      sellerType: "User" as const,
      sellerName: "Ramesh Kumar",
      category: vegCatId,
      description: "Oval cream-flesh potatoes with smooth thin skin. High dry matter ideal for both culinary preparation and long home storage.",
      price: 18,
      mandiBenchmarkPrice: 13,
      unit: "kg" as const,
      availableQuantity: 25000,
      minimumOrderQuantity: 15,
      qualityGrade: "Grade A" as const,
      harvestDate: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      location: { district: "Cuttack", state: "Odisha", pincode: "753001", coordinates: { latitude: 20.4625, longitude: 85.8828 } },
      images: ["/crops/potato.jpg"],
      status: "AVAILABLE" as const,
    },
    {
      name: "Sukinda Medium Red Onion",
      hindiName: "Pyaaz",
      variety: "Gavran Summer Red",
      seller: fpoUserId,
      sellerType: "FPO" as const,
      sellerName: "Odisha Farmers Producer Organization",
      category: vegCatId,
      description: "Naturally cured under ambient sheds. Standard 45-55mm grading with 3 outer protective skin layers. High pungency and transit tolerance.",
      price: 28,
      mandiBenchmarkPrice: 21,
      unit: "kg" as const,
      availableQuantity: 35000,
      minimumOrderQuantity: 25,
      qualityGrade: "Grade A" as const,
      harvestDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      location: { district: "Jajpur", state: "Odisha", pincode: "755018", coordinates: { latitude: 20.9547, longitude: 85.9123 } },
      images: ["/crops/onion.jpg"],
      status: "AVAILABLE" as const,
    },
    {
      name: "Pusa 1121 Premium Basmati Rice",
      hindiName: "Basmati Chawal",
      variety: "Pusa 1121 Steam Milled",
      seller: fpoUserId,
      sellerType: "FPO" as const,
      sellerName: "Odisha Farmers Producer Organization",
      category: grainsCatId,
      description: "Extra-long slender aromatic grains. Steam-milled and cured for optimum elongation, non-sticky cooking, and rich fragrance.",
      price: 82,
      mandiBenchmarkPrice: 70,
      unit: "kg" as const,
      availableQuantity: 18000,
      minimumOrderQuantity: 25,
      qualityGrade: "Premium Organic" as const,
      harvestDate: new Date(Date.now() - 45 * 24 * 3600 * 1000),
      location: { district: "Sambalpur", state: "Odisha", pincode: "768001", coordinates: { latitude: 21.4669, longitude: 83.9812 } },
      images: ["/crops/basmati.jpg"],
      status: "AVAILABLE" as const,
    },
    {
      name: "Snowball Fresh Cauliflower",
      hindiName: "Phool Gobhi",
      variety: "Snowball 16",
      seller: farmerUserId,
      sellerType: "User" as const,
      sellerName: "Ramesh Kumar",
      category: vegCatId,
      description: "Compact snowball-white curds jacketed in crisp outer leaves. Crisp texture, freshly harvested early morning for maximum farm-to-table crunch.",
      price: 22,
      mandiBenchmarkPrice: 15,
      unit: "kg" as const,
      availableQuantity: 8000,
      minimumOrderQuantity: 10,
      qualityGrade: "Grade A" as const,
      harvestDate: new Date(Date.now() - 12 * 3600 * 1000),
      location: { district: "Cuttack", state: "Odisha", pincode: "753001", coordinates: { latitude: 20.4625, longitude: 85.8828 } },
      images: ["/crops/cauliflower.jpg"],
      status: "AVAILABLE" as const,
    },
  ];

  // Clean up any old products that don't match our 5 SIH products
  await Product.deleteMany({ name: { $nin: productsData.map((p) => p.name) } });

  const productMap = new Map<string, string>();
  for (const p of productsData) {
    const doc = await Product.findOneAndUpdate(
      { name: p.name },
      p,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    productMap.set(p.name, doc._id.toString());

    // 9. Corresponding Inventory records
    const reservedAmt = Math.round(p.availableQuantity * 0.05);
    await Inventory.findOneAndUpdate(
      { product: doc._id },
      {
        product: doc._id,
        currentQuantity: p.availableQuantity + reservedAmt,
        reservedQuantity: reservedAmt,
        availableQuantity: p.availableQuantity,
        unit: p.unit,
        storageType: p.name.includes("Tomato") || p.name.includes("Cauliflower") ? "COLD_STORAGE" : "AMBIENT_WAREHOUSE",
        batchNumber: `BATCH-2026-${p.name.substring(0, 3).toUpperCase()}-01`,
        lastStockUpdate: new Date(),
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  // 10. Sample Orders & Delivery
  const tomatoProdId = productMap.get("Hybrid Red Table Tomato")!;
  const onionProdId = productMap.get("Sukinda Medium Red Onion")!;
  const cauliflowerProdId = productMap.get("Snowball Fresh Cauliflower")!;

  const sampleOrder = await Order.findOneAndUpdate(
    { orderNumber: "ORD-2026-SIH-001" },
    {
      orderNumber: "ORD-2026-SIH-001",
      buyer: buyerUserId,
      buyerType: "BULK_BUYER",
      seller: fpoUserId,
      sellerType: "FPO",
      items: [
        {
          product: onionProdId,
          productName: "Sukinda Medium Red Onion",
          quantity: 2000,
          unit: "kg",
          unitPrice: 28,
          totalItemPrice: 56000,
        },
      ],
      subtotal: 56000,
      deliveryFee: 0,
      total: 56000,
      deliveryAddress: {
        recipientName: "Bhubaneswar Fresh Foods",
        recipientPhone: "9824034567",
        addressLine: "Infocity Industrial Estate, Patia",
        district: "Khordha",
        state: "Odisha",
        pincode: "751024",
        coordinates: { latitude: 20.3541, longitude: 85.8172 },
      },
      orderStatus: "IN_TRANSIT",
      paymentStatus: "ESCROW_HELD",
      paymentMethod: "DIRECT_BANK_TRANSFER",
      notes: "Commercial wholesale lot for regional distribution.",
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  // Delivered sample order for Ramesh Kumar (Farmer) to establish solid earnings
  await Order.findOneAndUpdate(
    { orderNumber: "ORD-2026-SIH-002" },
    {
      orderNumber: "ORD-2026-SIH-002",
      buyer: buyerUserId,
      buyerType: "BULK_BUYER",
      seller: farmerUserId,
      sellerType: "User",
      items: [
        {
          product: tomatoProdId,
          productName: "Hybrid Red Table Tomato",
          quantity: 3500,
          unit: "kg",
          unitPrice: 24,
          totalItemPrice: 84000,
        },
        {
          product: cauliflowerProdId,
          productName: "Snowball Fresh Cauliflower",
          quantity: 1200,
          unit: "kg",
          unitPrice: 22,
          totalItemPrice: 26400,
        },
      ],
      subtotal: 110400,
      deliveryFee: 0,
      total: 110400,
      deliveryAddress: {
        recipientName: "Bhubaneswar Fresh Foods",
        recipientPhone: "9824034567",
        addressLine: "Infocity Industrial Estate, Patia",
        district: "Khordha",
        state: "Odisha",
        pincode: "751024",
        coordinates: { latitude: 20.3541, longitude: 85.8172 },
      },
      orderStatus: "DELIVERED",
      paymentStatus: "PAID",
      paymentMethod: "DIRECT_BANK_TRANSFER",
      notes: "Grade A batch successfully verified and accepted.",
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  const sampleVehicleId = vehicleMap.get("OD-02-CD-5678");
  const sampleRouteId = routeMap.get("ROUTE-CTC-BBS-01");

  await Delivery.findOneAndUpdate(
    { deliveryTrackingNumber: "DEL-TRK-2026-SIH-01" },
    {
      deliveryTrackingNumber: "DEL-TRK-2026-SIH-01",
      order: sampleOrder._id,
      pickupLocation: {
        name: "Cuttack Farm Gate Cluster",
        address: "Village Badamba, Athagarh Block",
        district: "Cuttack",
        state: "Odisha",
        latitude: 20.4625,
        longitude: 85.8828,
        contactPhone: "9822012345",
      },
      destination: {
        name: "Bhubaneswar Fresh Foods Central Depot",
        address: "Infocity Industrial Estate, Patia",
        district: "Khordha",
        state: "Odisha",
        latitude: 20.3541,
        longitude: 85.8172,
        contactPhone: "9824034567",
      },
      vehicle: sampleVehicleId,
      driverName: "Prasant Nayak",
      driverPhone: "9822993344",
      route: sampleRouteId,
      status: "IN_TRANSIT",
      estimatedDistanceKm: 38.5,
      estimatedDurationMinutes: 55,
      actualPickupTime: new Date(Date.now() - 1 * 3600 * 1000),
      temperatureCelsius: 16.5,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  // 11. AI Demand Forecasts
  await DemandForecast.findOneAndUpdate(
    { product: tomatoProdId, forecastPeriod: "Sep 2026 - W37" },
    {
      product: tomatoProdId,
      productName: "Hybrid Red Table Tomato",
      category: vegCatId,
      location: { district: "Khordha", state: "Odisha" },
      forecastPeriod: "Sep 2026 - W37",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      predictedDemandKg: 35000,
      confidenceScore: 0.91,
      trendDirection: "RISING",
      factors: {
        seasonalImpact: "High urban consumption in Bhubaneswar & Cuttack twin-city zone",
        festivalSurge: true,
        weatherCondition: "Favorable clear harvest conditions across coastal belts",
        historicalAverageKg: 24000,
      },
      aiModelVersion: "Gemini-1.5-Pro-Agritech",
      generatedAt: new Date(),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  await DemandForecast.findOneAndUpdate(
    { product: cauliflowerProdId, forecastPeriod: "Sep 2026 - W37" },
    {
      product: cauliflowerProdId,
      productName: "Snowball Fresh Cauliflower",
      category: vegCatId,
      location: { district: "Khordha", state: "Odisha" },
      forecastPeriod: "Sep 2026 - W37",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      predictedDemandKg: 18000,
      confidenceScore: 0.88,
      trendDirection: "RISING",
      factors: {
        seasonalImpact: "Early winter vegetable demand uptick in institutional canteens",
        festivalSurge: false,
        weatherCondition: "Moderate morning humidity, optimal floret preservation",
        historicalAverageKg: 12500,
      },
      aiModelVersion: "Gemini-1.5-Pro-Agritech",
      generatedAt: new Date(),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  // 12. AI Price Recommendations
  await PriceRecommendation.findOneAndUpdate(
    { product: tomatoProdId },
    {
      product: tomatoProdId,
      productName: "Hybrid Red Table Tomato",
      location: { district: "Cuttack", state: "Odisha" },
      currentFarmerPrice: 24,
      apmcModalBenchmarkPrice: 16,
      recommendedMinPrice: 22,
      recommendedMaxPrice: 26,
      factors: {
        apmcModalPrice: 16,
        distanceToHubKm: 28,
        gradeMultiplier: 1.2,
        demandSurgeMultiplier: 1.15,
        wholesaleInventoryLevel: "HEALTHY",
      },
      explanation:
        "Demand is projected to increase by +32% in Bhubaneswar urban clusters. Setting your price corridor at ₹22–₹26/kg gives a +38% to +62% margin above traditional Mandi middleman rates while retaining rapid buyer checkout velocity.",
      confidenceScore: 0.92,
      generatedAt: new Date(),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  await PriceRecommendation.findOneAndUpdate(
    { product: cauliflowerProdId },
    {
      product: cauliflowerProdId,
      productName: "Snowball Fresh Cauliflower",
      location: { district: "Cuttack", state: "Odisha" },
      currentFarmerPrice: 22,
      apmcModalBenchmarkPrice: 15,
      recommendedMinPrice: 20,
      recommendedMaxPrice: 24,
      factors: {
        apmcModalPrice: 15,
        distanceToHubKm: 28,
        gradeMultiplier: 1.18,
        demandSurgeMultiplier: 1.1,
        wholesaleInventoryLevel: "MODERATE",
      },
      explanation:
        "Grade A curds are currently in tight supply. A farm gate direct quote of ₹20–₹24/kg preserves strong institutional demand while capturing +33% premium over local commission agents.",
      confidenceScore: 0.89,
      generatedAt: new Date(),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  // 13. Sample Reviews
  await Review.findOneAndUpdate(
    { comment: "Outstanding farm-fresh quality! Arrived crisp and sweet." },
    {
      buyer: consumerUserId,
      product: tomatoProdId,
      rating: 5,
      freshnessScore: 5,
      packagingScore: 5,
      comment: "Outstanding farm-fresh quality! Arrived crisp and sweet.",
      verifiedPurchase: true,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  // 14. Seed Summary Counts
  const counts: SeedSummary = {
    categories: await Category.countDocuments(),
    users: await User.countDocuments(),
    farmerProfiles: await FarmerProfile.countDocuments(),
    fpos: await FPO.countDocuments(),
    buyerProfiles: await BuyerProfile.countDocuments(),
    vehicles: await Vehicle.countDocuments(),
    routes: await Route.countDocuments(),
    products: await Product.countDocuments(),
    inventories: await Inventory.countDocuments(),
    orders: await Order.countDocuments(),
    deliveries: await Delivery.countDocuments(),
    demandForecasts: await DemandForecast.countDocuments(),
    priceRecommendations: await PriceRecommendation.countDocuments(),
    reviews: await Review.countDocuments(),
    notifications: await Notification.countDocuments(),
  };

  return counts;
}
