import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/KISANOVA";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING AI PRICE RECOMMENDATION ADVISOR TESTS");
  console.log("==================================================\n");

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Import our engine and services
  const { calculateDeterministicPrice } = await import("../src/lib/price-analysis-engine.ts");
  const { getMarketBenchmark, seedMarketBenchmarksIfEmpty } = await import("../src/lib/market-price-service.ts");
  const { generateStructuredPriceAdvice, checkGeminiHealth } = await import("../src/lib/gemini.ts");
  const { PriceRecommendation } = await import("../src/models/PriceRecommendation.ts");
  const { User } = await import("../src/models/User.ts");

  // TEST 1: Benchmark Seeding & Lookup
  console.log("\n--- TEST 1: Market Benchmark Seeding & Lookup ---");
  const benchmarkCount = await seedMarketBenchmarksIfEmpty();
  console.log(`✅ Seeded/Verified ${benchmarkCount} market benchmarks in MongoDB`);

  const tomatoBenchmark = await getMarketBenchmark("Tomato", "Ganjam", "Odisha");
  console.log("Tomato Benchmark:", {
    product: tomatoBenchmark.productName,
    market: tomatoBenchmark.marketName,
    modal: tomatoBenchmark.modalPrice,
    corridor: `${tomatoBenchmark.minPrice}-${tomatoBenchmark.maxPrice}`,
    source: tomatoBenchmark.source,
  });

  if (tomatoBenchmark.modalPrice !== 24) {
    throw new Error(`Expected modal price 24 for Tomato, got ${tomatoBenchmark.modalPrice}`);
  }
  console.log("✅ TEST 1 PASSED: Market benchmark correctly retrieved.");

  // TEST 2: Deterministic Price Calculation
  console.log("\n--- TEST 2: Deterministic Price Engine Calculation ---");
  const detResult = await calculateDeterministicPrice({
    cropName: "Tomato",
    quantity: 500,
    qualityGrade: "Grade A",
    district: "Ganjam",
    state: "Odisha",
    transitDistanceKm: 45,
  });

  console.log("Deterministic Result:", {
    productName: detResult.productName,
    quantity: detResult.quantity,
    modalPrice: detResult.marketBenchmark.modalPrice,
    marketplaceAverage: detResult.marketplaceAverage,
    recommendedCorridor: `₹${detResult.recommendedMinPrice} - ₹${detResult.recommendedMaxPrice} / kg`,
    targetPrice: `₹${detResult.targetPrice} / kg`,
    confidence: `${detResult.confidenceScore}%`,
    grossRealization: `₹${detResult.netRealization.gross}`,
    logistics: `₹${detResult.netRealization.logistics}`,
    netRealization: `₹${detResult.netRealization.net}`,
    kisanDirectAdvantage: `+₹${detResult.traditionalComparison.kisanDirectAdvantagePerKg}/kg (+₹${detResult.traditionalComparison.kisanDirectTotalAdvantage} total)`,
  });

  if (detResult.recommendedMinPrice > detResult.recommendedMaxPrice) {
    throw new Error("Invalid corridor: Min > Max");
  }
  if (detResult.netRealization.net !== detResult.netRealization.gross - detResult.netRealization.logistics) {
    throw new Error("Net realization mismatch");
  }
  console.log("✅ TEST 2 PASSED: Deterministic engine calculated sound corridors and realization.");

  // TEST 3: Google Gemini Structured Advice
  console.log("\n--- TEST 3: Google Gemini Structured Advice ---");
  const health = await checkGeminiHealth();
  console.log("Gemini Health Status:", health.success ? "ONLINE" : "OFFLINE", health.model);

  const adviceResult = await generateStructuredPriceAdvice({
    productName: detResult.productName,
    quantity: detResult.quantity,
    qualityGrade: detResult.qualityGrade,
    location: detResult.location,
    marketMin: detResult.marketBenchmark.minPrice,
    marketModal: detResult.marketBenchmark.modalPrice,
    marketMax: detResult.marketBenchmark.maxPrice,
    marketplaceAverage: detResult.marketplaceAverage,
    recommendedMin: detResult.recommendedMinPrice,
    recommendedMax: detResult.recommendedMaxPrice,
    targetPrice: detResult.targetPrice,
    demandLevel: detResult.demandLevel,
    buyerInquiriesCount: detResult.buyerInquiriesCount,
    logisticsCost: detResult.logisticsCostPerKg,
  });

  console.log("Gemini Advice Output:", {
    isAiGenerated: adviceResult.isAiGenerated,
    modelUsed: adviceResult.modelUsed,
    summary: adviceResult.summary.slice(0, 100) + "...",
    factorsCount: adviceResult.factors.length,
    risksCount: adviceResult.risks.length,
    suggestion: adviceResult.suggestion.slice(0, 80) + "...",
  });

  if (!adviceResult.summary || adviceResult.factors.length === 0) {
    throw new Error("Gemini structured advice empty");
  }
  console.log("✅ TEST 3 PASSED: Gemini structured advice generated and validated.");

  // TEST 4: Fallback Resilience Test (Empty Key Simulation)
  console.log("\n--- TEST 4: Fallback Resilience When Gemini Fails ---");
  const savedKey = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = "";
    const fallbackAdvice = await generateStructuredPriceAdvice({
      productName: "Tomato",
      quantity: 500,
      qualityGrade: "Grade A",
      location: { district: "Ganjam", state: "Odisha" },
      marketMin: 20,
      marketModal: 24,
      marketMax: 27,
      marketplaceAverage: 25,
      recommendedMin: 24,
      recommendedMax: 27,
      targetPrice: 25,
      demandLevel: "HIGH",
      buyerInquiriesCount: 2,
      logisticsCost: 1.5,
    });

    console.log("Fallback Output:", {
      isAiGenerated: fallbackAdvice.isAiGenerated,
      modelUsed: fallbackAdvice.modelUsed,
      summary: fallbackAdvice.summary.slice(0, 80) + "...",
    });

    if (fallbackAdvice.isAiGenerated !== false) {
      throw new Error("Fallback should have isAiGenerated: false");
    }
    console.log("✅ TEST 4 PASSED: Safe deterministic fallback cleanly handled without crashing.");
  } finally {
    process.env.GEMINI_API_KEY = savedKey;
  }

  // TEST 5: Database Persistence
  console.log("\n--- TEST 5: Storing Recommendation in MongoDB ---");
  const farmer = await User.findOne({ email: "farmer@example.com" });
  if (!farmer) {
    throw new Error("Farmer user farmer@example.com not found in MongoDB");
  }

  const createdRec = await PriceRecommendation.create({
    farmerId: farmer._id,
    productName: "Tomato (Automated Test)",
    quantity: 500,
    qualityGrade: "Grade A",
    location: { district: "Ganjam", state: "Odisha" },
    currentFarmerPrice: detResult.targetPrice,
    apmcModalBenchmarkPrice: detResult.marketBenchmark.modalPrice,
    marketMin: detResult.marketBenchmark.minPrice,
    marketModal: detResult.marketBenchmark.modalPrice,
    marketMax: detResult.marketBenchmark.maxPrice,
    marketplaceAverage: detResult.marketplaceAverage,
    demandLevel: detResult.demandLevel,
    demandScore: detResult.demandScore,
    logisticsCost: detResult.logisticsCostPerKg,
    recommendedMinPrice: detResult.recommendedMinPrice,
    recommendedMaxPrice: detResult.recommendedMaxPrice,
    targetPrice: detResult.targetPrice,
    confidenceScore: detResult.confidenceScore,
    isAiGenerated: adviceResult.isAiGenerated,
    aiModel: adviceResult.modelUsed,
    source: detResult.marketBenchmark.source,
    explanation: adviceResult.summary,
    aiSummary: adviceResult.summary,
    aiSuggestion: adviceResult.suggestion,
    risks: adviceResult.risks,
    netRealization: detResult.netRealization,
    traditionalComparison: detResult.traditionalComparison,
    factors: {
      apmcModalPrice: detResult.marketBenchmark.modalPrice,
      distanceToHubKm: detResult.factors.distanceToHubKm,
      gradeMultiplier: detResult.factors.gradeMultiplier,
      supplyDeficitPercent: detResult.factors.supplyDeficitPercent,
    },
    generatedAt: new Date(),
  });

  console.log(`✅ Stored recommendation ID: ${createdRec._id}`);
  const retrieved = await PriceRecommendation.findById(createdRec._id);
  if (!retrieved || retrieved.productName !== "Tomato (Automated Test)") {
    throw new Error("Could not retrieve created recommendation from MongoDB");
  }
  console.log("✅ TEST 5 PASSED: Persistence & retrieval validated.");

  console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
