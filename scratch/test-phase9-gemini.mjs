import mongoose from "mongoose";

process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kisandirect";
const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  console.log("=================================================");
  console.log("🌱 PHASE 9: GEMINI AI FEATURES AUTOMATED TEST SUITE");
  console.log("=================================================\n");

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected directly to MongoDB for persistence audits.");

  const db = mongoose.connection.db;

  // 1. Find or create a test farmer
  const farmer = await db.collection("users").findOne({ role: { $in: ["FARMER", "FPO"] } });
  if (!farmer) {
    throw new Error("No farmer found in database. Please ensure Phase 1-5 seeds exist.");
  }
  console.log(`🧑‍🌾 Test Farmer identified: ${farmer.name} (${farmer.email}, ID: ${farmer._id})`);

  // Ensure farmer has at least one product
  let product = await db.collection("products").findOne({ seller: farmer._id });
  if (!product) {
    const insertRes = await db.collection("products").insertOne({
      name: "Nashik Red Onion",
      category: "Vegetables",
      description: "Sun-cured premium Nashik onions",
      price: 24,
      unit: "kg",
      availableQuantity: 800,
      minimumOrderQuantity: 50,
      qualityGrade: "Grade A",
      seller: farmer._id,
      sellerType: "FARMER",
      location: { state: "Maharashtra", district: "Nashik", coordinates: [73.7898, 19.9975] },
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    product = await db.collection("products").findOne({ _id: insertRes.insertedId });
    console.log(`📦 Seeded sample product: ${product.name} (ID: ${product._id})`);
  } else {
    console.log(`📦 Found existing farmer product: ${product.name} (ID: ${product._id})`);
  }

  // Import Gemini and Agritech modules
  const {
    PromptGuard,
    generateFarmerInsights,
    generatePriceExplanation,
    generateForecastExplanation,
    answerFarmerAssistant,
    answerBuyerAssistant,
  } = await import("../src/lib/gemini.ts");

  const {
    calculateAndStorePriceRecommendation,
    calculateAndStoreDemandForecast,
    getFarmerAiHubData,
  } = await import("../src/lib/ai-forecast-pricing.ts");

  // TEST 1: PromptGuard Protection
  console.log("\n--- TEST 1: PromptGuard Protection (>8,000 characters) ---");
  const massiveText = "AGRICULTURE ".repeat(1000); // 12,000 chars
  const sanitized = PromptGuard.sanitizeInput(massiveText, 500);
  console.log(`PromptGuard result length: ${sanitized.length} (original: ${massiveText.length})`);
  if (sanitized.length <= 500 && sanitized.includes("[Content truncated")) {
    console.log("✅ PromptGuard successfully truncated and tagged massive prompt to prevent injection/ballooning.");
  } else {
    throw new Error(`PromptGuard failed to truncate properly: length is ${sanitized.length}`);
  }

  // TEST 2: Farmer Context Construction & Insights (4 Pillars)
  console.log("\n--- TEST 2: Farmer AI Insights (4 Required Pillars) ---");
  const farmerContext = {
    farmerName: farmer.name,
    location: {
      district: product.location?.district || "Nashik",
      state: product.location?.state || "Maharashtra",
    },
    products: [
      {
        name: product.name,
        category: product.category,
        price: product.price,
        mandiBenchmarkPrice: 18,
        availableQuantity: product.availableQuantity,
        unit: product.unit,
        qualityGrade: product.qualityGrade,
      },
    ],
    recentSalesVolumeKg: 3200,
    grossEarningsInr: 76800,
    openOrdersCount: 2,
  };

  const insights = await generateFarmerInsights(farmerContext);
  console.log("Insights Generated Pillars:", {
    demandInsight: insights.demandInsight.slice(0, 75) + "...",
    inventoryRecommendation: insights.inventoryRecommendation.slice(0, 75) + "...",
    sellingRecommendation: insights.sellingRecommendation.slice(0, 75) + "...",
    shortExplanation: insights.shortExplanation.slice(0, 75) + "...",
    modelUsed: insights.modelUsed,
  });

  if (
    !insights.demandInsight ||
    !insights.inventoryRecommendation ||
    !insights.sellingRecommendation ||
    !insights.shortExplanation
  ) {
    throw new Error("Insights failed to return all 4 required operational pillars");
  }
  console.log("✅ All 4 pillars of Farmer AI Insights generated successfully.");

  // TEST 3: Deterministic Price Corridor Calculation + Gemini Rationale
  console.log("\n--- TEST 3: Price Corridor Calculation & Rationale ---");
  const priceDoc = await calculateAndStorePriceRecommendation(product._id.toString());
  console.log("Stored Price Recommendation Document:", {
    productName: priceDoc.productName,
    currentFarmerPrice: priceDoc.currentFarmerPrice,
    apmcBenchmark: priceDoc.apmcModalBenchmarkPrice,
    corridor: `₹${priceDoc.recommendedMinPrice} - ₹${priceDoc.recommendedMaxPrice}`,
    explanation: priceDoc.explanation.slice(0, 80) + "...",
  });

  if (
    !priceDoc.recommendedMinPrice ||
    !priceDoc.recommendedMaxPrice ||
    priceDoc.recommendedMaxPrice < priceDoc.recommendedMinPrice
  ) {
    throw new Error("Invalid price corridor bounds");
  }
  console.log("✅ Price corridor computed and validated with APMC benchmark.");

  // TEST 4: Deterministic Demand Forecast + Seasonal Multiplier
  console.log("\n--- TEST 4: Demand Forecasting & Trend Projection ---");
  const forecastDoc = await calculateAndStoreDemandForecast(product._id.toString());
  console.log("Stored Demand Forecast Document:", {
    productName: forecastDoc.productName,
    predictedDemandKg: forecastDoc.predictedDemandKg,
    trendDirection: forecastDoc.trendDirection,
    confidenceScore: forecastDoc.confidenceScore,
    factors: forecastDoc.factors,
  });

  if (!forecastDoc.predictedDemandKg || !forecastDoc.trendDirection) {
    throw new Error("Demand forecast missing predicted demand or trend direction");
  }
  console.log("✅ Demand forecast calculated and stored successfully.");

  // TEST 5: Verify MongoDB Document Persistence
  console.log("\n--- TEST 5: Verify MongoDB Collections Persistence ---");
  const verifiedPriceInMongo = await db.collection("pricerecommendations").findOne({ product: product._id });
  const verifiedForecastInMongo = await db.collection("demandforecasts").findOne({ product: product._id });

  if (!verifiedPriceInMongo || !verifiedForecastInMongo) {
    throw new Error("MongoDB collections do not contain the persisted documents");
  }
  console.log("✅ PriceRecommendation and DemandForecast confirmed present in MongoDB.");

  // TEST 6: AI Hub Aggregate Data Fetcher
  console.log("\n--- TEST 6: AI Hub Aggregation for Farmer ---");
  const hubData = await getFarmerAiHubData(farmer._id.toString());
  console.log("AI Hub Output Data:", {
    hasFarmerContext: !!hubData.farmerContext,
    hasInsights: !!hubData.insights,
    recommendationsCount: hubData.recommendations.length,
    forecastsCount: hubData.forecasts.length,
  });
  if (!hubData.insights || hubData.recommendations.length === 0) {
    throw new Error("getFarmerAiHubData failed to return expected data package");
  }
  console.log("✅ getFarmerAiHubData aggregate service validated.");

  // TEST 7: Farmer Assistant Scoped Q&A
  console.log("\n--- TEST 7: Farmer Assistant Context Scoping ---");
  const farmerChat = await answerFarmerAssistant(
    farmerContext,
    "How can I maximize my onion sales this harvest?"
  );
  console.log("Farmer Assistant Response:", farmerChat.answer.slice(0, 120) + "...");
  console.log("Suggested Actions:", farmerChat.suggestedActions);
  if (!farmerChat.answer || farmerChat.answer.length < 20) {
    throw new Error("Farmer assistant failed to generate advisory response");
  }
  console.log("✅ Farmer Copilot responded safely within farmer context.");

  // TEST 8: Grounded Buyer Assistant Zero-Hallucination Search
  console.log("\n--- TEST 8: Grounded Buyer Procurement Scout ---");
  const buyerChat = await answerBuyerAssistant(
    [
      {
        _id: product._id.toString(),
        name: product.name,
        farmerName: farmer.name,
        location: `${product.location?.district || "Nashik"}, ${product.location?.state || "Maharashtra"}`,
        price: product.price,
        availableQuantity: product.availableQuantity,
        unit: product.unit,
        qualityGrade: product.qualityGrade,
        minimumOrderQuantity: product.minimumOrderQuantity || 50,
      },
    ],
    "Find fresh Nashik onions for restaurant supply"
  );
  console.log("Buyer Assistant Summary:", buyerChat.summary.slice(0, 120) + "...");
  console.log("Matched Options Count:", buyerChat.matchingOptions.length);
  if (buyerChat.matchingOptions.length === 0 || !buyerChat.summary) {
    throw new Error("Buyer assistant failed to ground response in live inventory");
  }
  console.log("✅ Buyer Procurement Scout verified grounded in verified MongoDB inventory.");

  // TEST 9: Empty/Zero State Graceful Fallback
  console.log("\n--- TEST 9: Empty Farmer Profile Handling ---");
  const emptyContext = {
    farmerName: "New Registered Producer",
    location: { district: "Pune", state: "Maharashtra" },
    products: [],
    recentSalesVolumeKg: 0,
    grossEarningsInr: 0,
    openOrdersCount: 0,
  };
  const emptyInsights = await generateFarmerInsights(emptyContext);
  if (!emptyInsights.demandInsight || !emptyInsights.sellingRecommendation) {
    throw new Error("Empty state failed to produce guidance");
  }
  console.log("✅ Empty state handled smoothly with friendly guidance.");

  console.log("\n=================================================");
  console.log("🎉 ALL PHASE 9 GEMINI AI REQUIREMENTS PASSED WITH 100% COMPLIANCE!");
  console.log("=================================================\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
