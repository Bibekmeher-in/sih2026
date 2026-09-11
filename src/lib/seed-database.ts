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
  FarmerGroup,
  GroupMembership,
  CommunityPost,
  CommunityComment,
  ProduceAggregation,
  BulkRequirement,
  MarketPrice,
} from "@/models";
import { seedMarketBenchmarksIfEmpty } from "@/lib/market-price-service";
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
  farmerGroups?: number;
  communityPosts?: number;
  produceAggregations?: number;
  bulkRequirements?: number;
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
    {
      name: "Golden Acre Fresh Cabbage",
      hindiName: "Patta Gobhi",
      variety: "Golden Acre",
      seller: farmerUserId,
      sellerType: "User" as const,
      sellerName: "Ramesh Kumar",
      category: vegCatId,
      description: "Crisp, compact green heads with tender leaves. Packed at peak crispness for fresh consumption and long refrigerated storage.",
      price: 18,
      mandiBenchmarkPrice: 12,
      unit: "kg" as const,
      availableQuantity: 12000,
      minimumOrderQuantity: 10,
      qualityGrade: "Grade A" as const,
      harvestDate: new Date(Date.now() - 14 * 3600 * 1000),
      location: { district: "Cuttack", state: "Odisha", pincode: "753001", coordinates: { latitude: 20.4625, longitude: 85.8828 } },
      images: ["/crops/cabbage.jpg"],
      status: "AVAILABLE" as const,
    },
    {
      name: "Utkal Anushree Green Brinjal",
      hindiName: "Baingan",
      variety: "Utkal Anushree",
      seller: farmerUserId,
      sellerType: "User" as const,
      sellerName: "Ramesh Kumar",
      category: vegCatId,
      description: "Glossy, slender green brinjals indigenous to Odisha. Tender texture with negligible seeds and sweet cooking profile.",
      price: 26,
      mandiBenchmarkPrice: 19,
      unit: "kg" as const,
      availableQuantity: 7500,
      minimumOrderQuantity: 5,
      qualityGrade: "Grade A" as const,
      harvestDate: new Date(Date.now() - 8 * 3600 * 1000),
      location: { district: "Cuttack", state: "Odisha", pincode: "753001", coordinates: { latitude: 20.4625, longitude: 85.8828 } },
      images: ["/crops/brinjal.jpg"],
      status: "AVAILABLE" as const,
    },
    {
      name: "G-4 Spicy Green Chilli",
      hindiName: "Hari Mirch",
      variety: "G-4 Hot Green",
      seller: fpoUserId,
      sellerType: "FPO" as const,
      sellerName: "Odisha Farmers Producer Organization",
      category: vegCatId,
      description: "Fiery pungent fresh green chillies with firm green calyx. Sorted for uniform 7-9cm length with zero decay.",
      price: 45,
      mandiBenchmarkPrice: 35,
      unit: "kg" as const,
      availableQuantity: 4200,
      minimumOrderQuantity: 5,
      qualityGrade: "Grade A" as const,
      harvestDate: new Date(Date.now() - 18 * 3600 * 1000),
      location: { district: "Ganjam", state: "Odisha", pincode: "761001", coordinates: { latitude: 19.3149, longitude: 84.7941 } },
      images: ["/crops/chilli.jpg"],
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

  // 10. Sample Orders & Delivery (32 realistic orders covering all lifecycle states)
  const tomatoProdId = productMap.get("Hybrid Red Table Tomato")!;
  const potatoProdId = productMap.get("Kufri Jyoti Table Potato")!;
  const onionProdId = productMap.get("Sukinda Medium Red Onion")!;
  const riceProdId = productMap.get("Pusa 1121 Premium Basmati Rice")!;
  const cauliflowerProdId = productMap.get("Snowball Fresh Cauliflower")!;
  const cabbageProdId = productMap.get("Golden Acre Fresh Cabbage")!;
  const brinjalProdId = productMap.get("Utkal Anushree Green Brinjal")!;
  const chilliProdId = productMap.get("G-4 Spicy Green Chilli")!;

  const sampleVehicleId = vehicleMap.get("OD-02-CD-5678");
  const sampleRouteId = routeMap.get("ROUTE-CTC-BBS-01");

  // Helper to build realistic status history array
  const buildHistory = (status: string, createdAt: Date) => {
    const baseTime = createdAt.getTime();
    const history: Array<{ status: any; timestamp: Date; note: string }> = [
      { status: "PENDING", timestamp: new Date(baseTime), note: "Order placed by buyer" },
    ];
    if (status === "PENDING") return history;

    history.push({
      status: "CONFIRMED",
      timestamp: new Date(baseTime + 15 * 60 * 1000),
      note: "Order confirmed by grower. Produce reserved.",
    });
    if (status === "CONFIRMED") return history;

    history.push({
      status: "PROCESSING",
      timestamp: new Date(baseTime + 45 * 60 * 1000),
      note: "Undergoing farm-gate grading, sorting and cold-crate packing.",
    });
    if (status === "PROCESSING") return history;

    history.push({
      status: "READY_FOR_PICKUP",
      timestamp: new Date(baseTime + 90 * 60 * 1000),
      note: "Packaged at dispatch bay awaiting carrier fleet.",
    });

    history.push({
      status: "PICKED_UP",
      timestamp: new Date(baseTime + 120 * 60 * 1000),
      note: "Collected by KISANOVA cold-chain fleet.",
    });

    history.push({
      status: "IN_TRANSIT",
      timestamp: new Date(baseTime + 150 * 60 * 1000),
      note: "Shipment in transit via NH-16 corridor.",
    });
    if (status === "IN_TRANSIT") return history;

    history.push({
      status: "OUT_FOR_DELIVERY",
      timestamp: new Date(baseTime + 210 * 60 * 1000),
      note: "Driver is arriving at doorstep delivery hub.",
    });

    history.push({
      status: "DELIVERED",
      timestamp: new Date(baseTime + 240 * 60 * 1000),
      note: "Order delivered safely and verified via OTP.",
    });
    return history;
  };

  const ordersSeedList = [
    // 5 PENDING
    {
      orderNumber: "KD-CON-2026-000101",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: tomatoProdId, productName: "Hybrid Red Table Tomato", quantity: 10, unit: "kg", unitPrice: 24, totalItemPrice: 240, qualityGrade: "Grade A" }],
      subtotal: 240,
      deliveryFee: 40,
      total: 280,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      hoursAgo: 1,
    },
    {
      orderNumber: "KD-CON-2026-000102",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: potatoProdId, productName: "Kufri Jyoti Table Potato", quantity: 15, unit: "kg", unitPrice: 18, totalItemPrice: 270, qualityGrade: "Grade A" }],
      subtotal: 270,
      deliveryFee: 40,
      total: 310,
      district: "Puri",
      city: "Puri Town",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      hoursAgo: 2,
    },
    {
      orderNumber: "KD-CON-2026-000103",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: cauliflowerProdId, productName: "Snowball Fresh Cauliflower", quantity: 8, unit: "kg", unitPrice: 22, totalItemPrice: 176, qualityGrade: "Grade A" }],
      subtotal: 176,
      deliveryFee: 40,
      total: 216,
      district: "Cuttack",
      city: "Cuttack City",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      hoursAgo: 3,
    },
    {
      orderNumber: "KD-BLK-2026-000201",
      buyer: buyerUserId,
      buyerType: "BULK_BUYER",
      seller: fpoUserId,
      sellerType: "FPO",
      items: [{ product: onionProdId, productName: "Sukinda Medium Red Onion", quantity: 1500, unit: "kg", unitPrice: 28, totalItemPrice: 42000, qualityGrade: "Grade A" }],
      subtotal: 42000,
      deliveryFee: 0,
      total: 42000,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      hoursAgo: 4,
    },
    {
      orderNumber: "KD-CON-2026-000104",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: fpoUserId,
      sellerType: "FPO",
      items: [
        { product: chilliProdId, productName: "G-4 Spicy Green Chilli", quantity: 4, unit: "kg", unitPrice: 45, totalItemPrice: 180, qualityGrade: "Grade A" },
        { product: brinjalProdId, productName: "Utkal Anushree Green Brinjal", quantity: 6, unit: "kg", unitPrice: 26, totalItemPrice: 156, qualityGrade: "Grade A" },
      ],
      subtotal: 336,
      deliveryFee: 40,
      total: 376,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      hoursAgo: 5,
    },

    // 5 CONFIRMED
    {
      orderNumber: "KD-CON-2026-000105",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: tomatoProdId, productName: "Hybrid Red Table Tomato", quantity: 12, unit: "kg", unitPrice: 24, totalItemPrice: 288, qualityGrade: "Grade A" }],
      subtotal: 288,
      deliveryFee: 40,
      total: 328,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "CONFIRMED",
      paymentStatus: "PAID",
      hoursAgo: 6,
    },
    {
      orderNumber: "KD-CON-2026-000106",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: cabbageProdId, productName: "Golden Acre Fresh Cabbage", quantity: 10, unit: "kg", unitPrice: 18, totalItemPrice: 180, qualityGrade: "Grade A" }],
      subtotal: 180,
      deliveryFee: 40,
      total: 220,
      district: "Khordha",
      city: "Jatni",
      orderStatus: "CONFIRMED",
      paymentStatus: "PAID",
      hoursAgo: 7,
    },
    {
      orderNumber: "KD-BLK-2026-000202",
      buyer: buyerUserId,
      buyerType: "BULK_BUYER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: potatoProdId, productName: "Kufri Jyoti Table Potato", quantity: 3000, unit: "kg", unitPrice: 18, totalItemPrice: 54000, qualityGrade: "Grade A" }],
      subtotal: 54000,
      deliveryFee: 0,
      total: 54000,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "CONFIRMED",
      paymentStatus: "ESCROW_HELD",
      hoursAgo: 8,
    },
    {
      orderNumber: "KD-CON-2026-000107",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: fpoUserId,
      sellerType: "FPO",
      items: [{ product: riceProdId, productName: "Pusa 1121 Premium Basmati Rice", quantity: 15, unit: "kg", unitPrice: 82, totalItemPrice: 1230, qualityGrade: "Premium Organic" }],
      subtotal: 1230,
      deliveryFee: 0,
      total: 1230,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "CONFIRMED",
      paymentStatus: "PAID",
      hoursAgo: 9,
    },
    {
      orderNumber: "KD-CON-2026-000108",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: brinjalProdId, productName: "Utkal Anushree Green Brinjal", quantity: 8, unit: "kg", unitPrice: 26, totalItemPrice: 208, qualityGrade: "Grade A" }],
      subtotal: 208,
      deliveryFee: 40,
      total: 248,
      district: "Puri",
      city: "Konark",
      orderStatus: "CONFIRMED",
      paymentStatus: "PAID",
      hoursAgo: 10,
    },

    // 5 PROCESSING
    {
      orderNumber: "KD-CON-2026-000109",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: cauliflowerProdId, productName: "Snowball Fresh Cauliflower", quantity: 12, unit: "kg", unitPrice: 22, totalItemPrice: 264, qualityGrade: "Grade A" }],
      subtotal: 264,
      deliveryFee: 40,
      total: 304,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "PROCESSING",
      paymentStatus: "PAID",
      hoursAgo: 11,
    },
    {
      orderNumber: "KD-CON-2026-000110",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: tomatoProdId, productName: "Hybrid Red Table Tomato", quantity: 15, unit: "kg", unitPrice: 24, totalItemPrice: 360, qualityGrade: "Grade A" }],
      subtotal: 360,
      deliveryFee: 40,
      total: 400,
      district: "Cuttack",
      city: "Choudwar",
      orderStatus: "PROCESSING",
      paymentStatus: "PAID",
      hoursAgo: 12,
    },
    {
      orderNumber: "KD-BLK-2026-000203",
      buyer: buyerUserId,
      buyerType: "BULK_BUYER",
      seller: fpoUserId,
      sellerType: "FPO",
      items: [{ product: riceProdId, productName: "Pusa 1121 Premium Basmati Rice", quantity: 1200, unit: "kg", unitPrice: 82, totalItemPrice: 98400, qualityGrade: "Premium Organic" }],
      subtotal: 98400,
      deliveryFee: 0,
      total: 98400,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "PROCESSING",
      paymentStatus: "ESCROW_HELD",
      hoursAgo: 13,
    },
    {
      orderNumber: "KD-CON-2026-000111",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: fpoUserId,
      sellerType: "FPO",
      items: [{ product: chilliProdId, productName: "G-4 Spicy Green Chilli", quantity: 6, unit: "kg", unitPrice: 45, totalItemPrice: 270, qualityGrade: "Grade A" }],
      subtotal: 270,
      deliveryFee: 40,
      total: 310,
      district: "Ganjam",
      city: "Berhampur",
      orderStatus: "PROCESSING",
      paymentStatus: "PAID",
      hoursAgo: 14,
    },
    {
      orderNumber: "KD-CON-2026-000112",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: potatoProdId, productName: "Kufri Jyoti Table Potato", quantity: 20, unit: "kg", unitPrice: 18, totalItemPrice: 360, qualityGrade: "Grade A" }],
      subtotal: 360,
      deliveryFee: 40,
      total: 400,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "PROCESSING",
      paymentStatus: "PAID",
      hoursAgo: 15,
    },

    // 5 IN_TRANSIT
    {
      orderNumber: "KD-CON-2026-000113",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: tomatoProdId, productName: "Hybrid Red Table Tomato", quantity: 10, unit: "kg", unitPrice: 24, totalItemPrice: 240, qualityGrade: "Grade A" }],
      subtotal: 240,
      deliveryFee: 40,
      total: 280,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "IN_TRANSIT",
      paymentStatus: "PAID",
      hoursAgo: 16,
    },
    {
      orderNumber: "KD-CON-2026-000114",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [
        { product: cabbageProdId, productName: "Golden Acre Fresh Cabbage", quantity: 8, unit: "kg", unitPrice: 18, totalItemPrice: 144, qualityGrade: "Grade A" },
        { product: cauliflowerProdId, productName: "Snowball Fresh Cauliflower", quantity: 6, unit: "kg", unitPrice: 22, totalItemPrice: 132, qualityGrade: "Grade A" },
      ],
      subtotal: 276,
      deliveryFee: 40,
      total: 316,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "IN_TRANSIT",
      paymentStatus: "PAID",
      hoursAgo: 17,
    },
    {
      orderNumber: "KD-BLK-2026-000204",
      buyer: buyerUserId,
      buyerType: "BULK_BUYER",
      seller: fpoUserId,
      sellerType: "FPO",
      items: [{ product: onionProdId, productName: "Sukinda Medium Red Onion", quantity: 2000, unit: "kg", unitPrice: 28, totalItemPrice: 56000, qualityGrade: "Grade A" }],
      subtotal: 56000,
      deliveryFee: 0,
      total: 56000,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "IN_TRANSIT",
      paymentStatus: "ESCROW_HELD",
      hoursAgo: 18,
    },
    {
      orderNumber: "KD-CON-2026-000115",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: potatoProdId, productName: "Kufri Jyoti Table Potato", quantity: 12, unit: "kg", unitPrice: 18, totalItemPrice: 216, qualityGrade: "Grade A" }],
      subtotal: 216,
      deliveryFee: 40,
      total: 256,
      district: "Puri",
      city: "Puri",
      orderStatus: "IN_TRANSIT",
      paymentStatus: "PAID",
      hoursAgo: 19,
    },
    {
      orderNumber: "KD-CON-2026-000116",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: brinjalProdId, productName: "Utkal Anushree Green Brinjal", quantity: 10, unit: "kg", unitPrice: 26, totalItemPrice: 260, qualityGrade: "Grade A" }],
      subtotal: 260,
      deliveryFee: 40,
      total: 300,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "IN_TRANSIT",
      paymentStatus: "PAID",
      hoursAgo: 20,
    },

    // 10 DELIVERED
    {
      orderNumber: "KD-CON-2026-000117",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: potatoProdId, productName: "Kufri Jyoti Table Potato", quantity: 5, unit: "kg", unitPrice: 18, totalItemPrice: 90, qualityGrade: "Grade A" }],
      subtotal: 90,
      deliveryFee: 40,
      total: 130,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "DELIVERED",
      paymentStatus: "RELEASED_TO_SELLER",
      hoursAgo: 48,
    },
    {
      orderNumber: "KD-CON-2026-000118",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: tomatoProdId, productName: "Hybrid Red Table Tomato", quantity: 8, unit: "kg", unitPrice: 24, totalItemPrice: 192, qualityGrade: "Grade A" }],
      subtotal: 192,
      deliveryFee: 40,
      total: 232,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "DELIVERED",
      paymentStatus: "RELEASED_TO_SELLER",
      hoursAgo: 72,
    },
    {
      orderNumber: "KD-CON-2026-000119",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: cauliflowerProdId, productName: "Snowball Fresh Cauliflower", quantity: 10, unit: "kg", unitPrice: 22, totalItemPrice: 220, qualityGrade: "Grade A" }],
      subtotal: 220,
      deliveryFee: 40,
      total: 260,
      district: "Cuttack",
      city: "Cuttack",
      orderStatus: "DELIVERED",
      paymentStatus: "RELEASED_TO_SELLER",
      hoursAgo: 96,
    },
    {
      orderNumber: "KD-CON-2026-000120",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: fpoUserId,
      sellerType: "FPO",
      items: [{ product: riceProdId, productName: "Pusa 1121 Premium Basmati Rice", quantity: 25, unit: "kg", unitPrice: 82, totalItemPrice: 2050, qualityGrade: "Premium Organic" }],
      subtotal: 2050,
      deliveryFee: 0,
      total: 2050,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "DELIVERED",
      paymentStatus: "RELEASED_TO_SELLER",
      hoursAgo: 120,
    },
    {
      orderNumber: "KD-CON-2026-000121",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: cabbageProdId, productName: "Golden Acre Fresh Cabbage", quantity: 6, unit: "kg", unitPrice: 18, totalItemPrice: 108, qualityGrade: "Grade A" }],
      subtotal: 108,
      deliveryFee: 40,
      total: 148,
      district: "Puri",
      city: "Puri",
      orderStatus: "DELIVERED",
      paymentStatus: "RELEASED_TO_SELLER",
      hoursAgo: 144,
    },
    {
      orderNumber: "KD-BLK-2026-000205",
      buyer: buyerUserId,
      buyerType: "BULK_BUYER",
      seller: farmerUserId,
      sellerType: "User",
      items: [
        { product: tomatoProdId, productName: "Hybrid Red Table Tomato", quantity: 3500, unit: "kg", unitPrice: 24, totalItemPrice: 84000, qualityGrade: "Grade A" },
        { product: cauliflowerProdId, productName: "Snowball Fresh Cauliflower", quantity: 1200, unit: "kg", unitPrice: 22, totalItemPrice: 26400, qualityGrade: "Grade A" },
      ],
      subtotal: 110400,
      deliveryFee: 0,
      total: 110400,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "DELIVERED",
      paymentStatus: "RELEASED_TO_SELLER",
      hoursAgo: 168,
    },
    {
      orderNumber: "KD-BLK-2026-000206",
      buyer: buyerUserId,
      buyerType: "BULK_BUYER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: potatoProdId, productName: "Kufri Jyoti Table Potato", quantity: 5000, unit: "kg", unitPrice: 18, totalItemPrice: 90000, qualityGrade: "Grade A" }],
      subtotal: 90000,
      deliveryFee: 0,
      total: 90000,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "DELIVERED",
      paymentStatus: "RELEASED_TO_SELLER",
      hoursAgo: 192,
    },
    {
      orderNumber: "KD-CON-2026-000122",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: fpoUserId,
      sellerType: "FPO",
      items: [
        { product: chilliProdId, productName: "G-4 Spicy Green Chilli", quantity: 3, unit: "kg", unitPrice: 45, totalItemPrice: 135, qualityGrade: "Grade A" },
        { product: brinjalProdId, productName: "Utkal Anushree Green Brinjal", quantity: 5, unit: "kg", unitPrice: 26, totalItemPrice: 130, qualityGrade: "Grade A" },
      ],
      subtotal: 265,
      deliveryFee: 40,
      total: 305,
      district: "Ganjam",
      city: "Berhampur",
      orderStatus: "DELIVERED",
      paymentStatus: "RELEASED_TO_SELLER",
      hoursAgo: 216,
    },
    {
      orderNumber: "KD-CON-2026-000123",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: fpoUserId,
      sellerType: "FPO",
      items: [{ product: onionProdId, productName: "Sukinda Medium Red Onion", quantity: 15, unit: "kg", unitPrice: 28, totalItemPrice: 420, qualityGrade: "Grade A" }],
      subtotal: 420,
      deliveryFee: 40,
      total: 460,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "DELIVERED",
      paymentStatus: "RELEASED_TO_SELLER",
      hoursAgo: 240,
    },
    {
      orderNumber: "KD-CON-2026-000124",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: tomatoProdId, productName: "Hybrid Red Table Tomato", quantity: 10, unit: "kg", unitPrice: 24, totalItemPrice: 240, qualityGrade: "Grade A" }],
      subtotal: 240,
      deliveryFee: 40,
      total: 280,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "DELIVERED",
      paymentStatus: "RELEASED_TO_SELLER",
      hoursAgo: 264,
    },

    // 2 CANCELLED
    {
      orderNumber: "KD-CON-2026-000125",
      buyer: consumerUserId,
      buyerType: "CONSUMER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: cauliflowerProdId, productName: "Snowball Fresh Cauliflower", quantity: 15, unit: "kg", unitPrice: 22, totalItemPrice: 330, qualityGrade: "Grade A" }],
      subtotal: 330,
      deliveryFee: 40,
      total: 370,
      district: "Cuttack",
      city: "Cuttack",
      orderStatus: "CANCELLED",
      paymentStatus: "REFUNDED",
      hoursAgo: 30,
    },
    {
      orderNumber: "KD-BLK-2026-000207",
      buyer: buyerUserId,
      buyerType: "BULK_BUYER",
      seller: farmerUserId,
      sellerType: "User",
      items: [{ product: cabbageProdId, productName: "Golden Acre Fresh Cabbage", quantity: 2000, unit: "kg", unitPrice: 18, totalItemPrice: 36000, qualityGrade: "Grade A" }],
      subtotal: 36000,
      deliveryFee: 0,
      total: 36000,
      district: "Khordha",
      city: "Bhubaneswar",
      orderStatus: "CANCELLED",
      paymentStatus: "REFUNDED",
      hoursAgo: 50,
    },
  ];

  for (const oData of ordersSeedList) {
    const createdAt = new Date(Date.now() - oData.hoursAgo * 3600 * 1000);
    const estDeliveryAt = new Date(createdAt.getTime() + 24 * 3600 * 1000);
    const deliveredAt = oData.orderStatus === "DELIVERED" ? new Date(createdAt.getTime() + 4 * 3600 * 1000) : undefined;
    const cancelledAt = oData.orderStatus === "CANCELLED" ? new Date(createdAt.getTime() + 1 * 3600 * 1000) : undefined;
    const statusHistory = buildHistory(oData.orderStatus, createdAt);

    if (oData.orderStatus === "CANCELLED") {
      statusHistory.push({
        status: "CANCELLED",
        timestamp: cancelledAt || new Date(),
        note: "Order was cancelled before packaging. Held funds refunded.",
      });
    }

    const orderDoc = await Order.findOneAndUpdate(
      { orderNumber: oData.orderNumber },
      {
        orderNumber: oData.orderNumber,
        buyer: oData.buyer,
        buyerType: oData.buyerType,
        seller: oData.seller,
        sellerType: oData.sellerType,
        items: oData.items,
        subtotal: oData.subtotal,
        deliveryFee: oData.deliveryFee,
        total: oData.total,
        deliveryAddress: {
          recipientName: oData.buyerType === "BULK_BUYER" ? "Bhubaneswar Fresh Foods" : "Demo Consumer",
          recipientPhone: oData.buyerType === "BULK_BUYER" ? "9824034567" : "9825045678",
          addressLine: `Plot 42, Sector 8, ${oData.city}`,
          district: oData.district,
          state: "Odisha",
          pincode: oData.district === "Cuttack" ? "753001" : oData.district === "Puri" ? "752001" : "751024",
          coordinates: {
            latitude: oData.district === "Cuttack" ? 20.4625 : oData.district === "Puri" ? 19.8135 : 20.3541,
            longitude: oData.district === "Cuttack" ? 85.8828 : oData.district === "Puri" ? 85.8312 : 85.8172,
          },
        },
        orderStatus: oData.orderStatus,
        paymentStatus: oData.paymentStatus,
        paymentMethod: oData.buyerType === "BULK_BUYER" ? "DIRECT_BANK_TRANSFER" : "UPI",
        statusHistory,
        deliveryOtp: "4829",
        otpVerified: oData.orderStatus === "DELIVERED",
        estimatedDeliveryAt: estDeliveryAt,
        deliveredAt,
        cancelledAt,
        createdAt,
        updatedAt: deliveredAt || cancelledAt || createdAt,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    // Create / Update linked Delivery record
    const deliveryTrackingNum = `DEL-TRK-${oData.orderNumber.replace(/[^0-9]/g, "")}`;
    const delStatus =
      oData.orderStatus === "DELIVERED"
        ? "DELIVERED"
        : oData.orderStatus === "CANCELLED"
        ? "FAILED"
        : oData.orderStatus === "IN_TRANSIT"
        ? "IN_TRANSIT"
        : oData.orderStatus === "PROCESSING"
        ? "ASSIGNED"
        : "PENDING_ASSIGNMENT";

    const deliveryDoc = await Delivery.findOneAndUpdate(
      { deliveryTrackingNumber: deliveryTrackingNum },
      {
        deliveryTrackingNumber: deliveryTrackingNum,
        order: orderDoc._id,
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
          name: oData.buyerType === "BULK_BUYER" ? "Bhubaneswar Fresh Foods Central Depot" : "Consumer Doorstep",
          address: `Plot 42, Sector 8, ${oData.city}`,
          district: oData.district,
          state: "Odisha",
          latitude: oData.district === "Cuttack" ? 20.4625 : 20.3541,
          longitude: oData.district === "Cuttack" ? 85.8828 : 85.8172,
          contactPhone: oData.buyerType === "BULK_BUYER" ? "9824034567" : "9825045678",
        },
        vehicle: sampleVehicleId,
        driverName: "Prasant Nayak",
        driverPhone: "9822993344",
        route: sampleRouteId,
        status: delStatus,
        estimatedDistanceKm: 28.5,
        estimatedDurationMinutes: 45,
        currentLocation: {
          latitude: 20.401,
          longitude: 85.845,
          updatedAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
        },
        otpCode: "4829",
        isOtpVerified: oData.orderStatus === "DELIVERED",
        actualPickupTime: oData.orderStatus === "IN_TRANSIT" || oData.orderStatus === "DELIVERED" ? new Date(createdAt.getTime() + 2 * 3600 * 1000) : undefined,
        actualDeliveryTime: deliveredAt,
        temperatureCelsius: 16.5,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    // Link delivery to order
    orderDoc.deliveryId = deliveryDoc._id;
    await orderDoc.save();
  }

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
      farmerId: farmerUserId,
      productName: "Hybrid Red Table Tomato",
      quantity: 500,
      qualityGrade: "Grade A",
      location: { district: "Cuttack", state: "Odisha" },
      currentFarmerPrice: 24,
      apmcModalBenchmarkPrice: 16,
      marketMin: 14,
      marketModal: 16,
      marketMax: 18,
      marketplaceAverage: 24,
      demandLevel: "HIGH",
      demandScore: 88,
      logisticsCost: 1.5,
      recommendedMinPrice: 22,
      recommendedMaxPrice: 26,
      targetPrice: 24,
      confidenceScore: 0.92,
      isAiGenerated: true,
      aiModel: "Google Gemini 1.5 Pro",
      source: "Market Benchmark (APMC Modal Rate)",
      factors: {
        apmcModalPrice: 16,
        distanceToHubKm: 28,
        gradeMultiplier: 1.2,
        supplyDeficitPercent: 14,
        demandFactorText: "High Procurement Demand (+32% in Bhubaneswar urban clusters)",
        qualityFactorText: "Grade A uniform sorting commands direct buyer premium",
        logisticsFactorText: "₹1.50/kg estimated logistics across 28 km transit corridor",
        supplyFactorText: "Healthy wholesale inventory buffer",
      },
      netRealization: {
        gross: 12000,
        logistics: 750,
        platformFee: 0,
        net: 11250,
      },
      traditionalComparison: {
        traditionalRatePerKg: 14.8,
        traditionalNet: 7400,
        kisanDirectAdvantagePerKg: 9.2,
        kisanDirectTotalAdvantage: 3850,
      },
      explanation:
        "Demand is projected to increase by +32% in Bhubaneswar urban clusters. Setting your price corridor at ₹22–₹26/kg gives a +38% to +62% margin above traditional Mandi middleman rates while retaining rapid buyer checkout velocity.",
      aiSummary:
        "Demand is projected to increase by +32% in Bhubaneswar urban clusters. Setting your price corridor at ₹22–₹26/kg gives a +38% to +62% margin above traditional Mandi middleman rates while retaining rapid buyer checkout velocity.",
      aiSuggestion: "List at ₹24/kg to balance fast checkout with maximum farm-gate net margin.",
      risks: [
        "Spot prices may soften if local mandi harvest arrivals spike over the weekend.",
        "Longer transit times without reefer van can increase perishability loss.",
      ],
      generatedAt: new Date(),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  await PriceRecommendation.findOneAndUpdate(
    { product: cauliflowerProdId },
    {
      product: cauliflowerProdId,
      farmerId: farmerUserId,
      productName: "Snowball Fresh Cauliflower",
      quantity: 400,
      qualityGrade: "Grade A",
      location: { district: "Cuttack", state: "Odisha" },
      currentFarmerPrice: 22,
      apmcModalBenchmarkPrice: 15,
      marketMin: 13,
      marketModal: 15,
      marketMax: 18,
      marketplaceAverage: 22,
      demandLevel: "MODERATE",
      demandScore: 78,
      logisticsCost: 1.4,
      recommendedMinPrice: 20,
      recommendedMaxPrice: 24,
      targetPrice: 22,
      confidenceScore: 0.89,
      isAiGenerated: true,
      aiModel: "Google Gemini 1.5 Pro",
      source: "Market Benchmark (APMC Modal Rate)",
      factors: {
        apmcModalPrice: 15,
        distanceToHubKm: 28,
        gradeMultiplier: 1.18,
        supplyDeficitPercent: 8,
        demandFactorText: "Stable institutional kitchen demand across Cuttack-Bhubaneswar",
        qualityFactorText: "Grade A curds command +33% premium over local commission agents",
        logisticsFactorText: "₹1.40/kg estimated logistics across 28 km transit corridor",
        supplyFactorText: "Moderate wholesale arrivals reported",
      },
      netRealization: {
        gross: 8800,
        logistics: 560,
        platformFee: 0,
        net: 8240,
      },
      traditionalComparison: {
        traditionalRatePerKg: 13.9,
        traditionalNet: 5560,
        kisanDirectAdvantagePerKg: 8.1,
        kisanDirectTotalAdvantage: 2680,
      },
      explanation:
        "Grade A curds are currently in tight supply. A farm gate direct quote of ₹20–₹24/kg preserves strong institutional demand while capturing +33% premium over local commission agents.",
      aiSummary:
        "Grade A curds are currently in tight supply. A farm gate direct quote of ₹20–₹24/kg preserves strong institutional demand while capturing +33% premium over local commission agents.",
      aiSuggestion: "Maintain harvest packing within 24 hours of cutting to prevent curd yellowing.",
      risks: [
        "Curd weight loss occurs rapidly in open transit without shade cover.",
      ],
      generatedAt: new Date(),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  // Seed Market Benchmark Data
  await seedMarketBenchmarksIfEmpty();

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

  // 14. Seed FPO & Farmer Community Data
  const { seedFpoCommunityData } = await import("./seed-fpo-data");
  await seedFpoCommunityData();

  // 15. Seed Summary Counts
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
    farmerGroups: await FarmerGroup.countDocuments(),
    communityPosts: await CommunityPost.countDocuments(),
    produceAggregations: await ProduceAggregation.countDocuments(),
    bulkRequirements: await BulkRequirement.countDocuments(),
  };

  return counts;
}
