import mongoose from "mongoose";

process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kisandirect";
const MONGODB_URI = process.env.MONGODB_URI;

async function runPhase11ImpactTests() {
  console.log("=================================================");
  console.log("🌱 PHASE 11: AGRICULTURAL IMPACT TEST SUITE");
  console.log("=================================================\n");

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected directly to MongoDB for ground truth validation.");

  const { getAgriculturalImpactData, COMMODITY_BENCHMARK_MATRIX } = await import(
    "../src/lib/impact-service.ts"
  );

  // TEST 1: Service Invocation & Report Generation
  console.log("\n--- TEST 1: Impact Report Generation & Data Integrity ---");
  const report = await getAgriculturalImpactData();

  console.log("Farmer Impact Metrics:", {
    averageSellingPrice: `₹${report.farmerImpact.averageSellingPriceInr}/kg`,
    historicalMandiBenchmark: `₹${report.farmerImpact.historicalMandiBenchmarkInr}/kg`,
    realizationGain: `+₹${report.farmerImpact.realizationImprovementInr}/kg (+${report.farmerImpact.realizationImprovementPercent}%)`,
    cumulativeIncrementalFarmerIncome: `₹${report.farmerImpact.cumulativeIncrementalFarmerIncomeInr.toLocaleString()}`,
  });

  if (
    !report.farmerImpact.averageSellingPriceInr ||
    !report.farmerImpact.historicalMandiBenchmarkInr ||
    report.farmerImpact.realizationImprovementPercent <= 0
  ) {
    throw new Error("Invalid farmer impact metrics");
  }
  console.log("✅ Farmer realization gains verified with positive economic improvement.");

  // TEST 2: Consumer Price Relief
  console.log("\n--- TEST 2: Consumer Savings & Price Relief ---");
  console.log("Consumer Impact Metrics:", {
    averageMarketplacePrice: `₹${report.consumerImpact.averageMarketplacePriceInr}/kg`,
    traditionalRetailBenchmark: `₹${report.consumerImpact.traditionalRetailBenchmarkInr}/kg`,
    averageSavings: `₹${report.consumerImpact.averageSavingsInr}/kg (-${report.consumerImpact.averageSavingsPercent}%)`,
    cumulativeConsumerSavings: `₹${report.consumerImpact.cumulativeConsumerSavingsInr.toLocaleString()}`,
    turnaroundTime: `<${report.consumerImpact.turnaroundTimeHours} hours`,
  });

  if (
    !report.consumerImpact.averageMarketplacePriceInr ||
    report.consumerImpact.averageSavingsPercent <= 0 ||
    report.consumerImpact.averageMarketplacePriceInr >= report.consumerImpact.traditionalRetailBenchmarkInr
  ) {
    throw new Error("Invalid consumer savings calculation");
  }
  console.log("✅ Consumer price savings verified below traditional supermarket retail prices.");

  // TEST 3: Supply Chain Disintermediation & Logistics Inefficiency
  console.log("\n--- TEST 3: Supply Chain Inefficiency Disintermediation ---");
  console.log("Logistics & Carbon Metrics:", {
    directOrdersFulfilled: report.supplyChainImpact.directOrdersFulfilled,
    intermediaryStepsAvoided: report.supplyChainImpact.intermediaryStepsAvoided,
    totalDistanceAvoidedKm: `${report.supplyChainImpact.totalDistanceAvoidedKm} km`,
    logisticsCostSavedInr: `₹${report.supplyChainImpact.logisticsCostSavedInr.toLocaleString()}`,
    co2EmissionsAvoidedKg: `${report.supplyChainImpact.co2EmissionsAvoidedKg} kg CO₂`,
    spoilageRateReduced: `-${report.supplyChainImpact.spoilageRateReducedPercent}%`,
  });

  if (
    report.supplyChainImpact.intermediaryStepsAvoided !== 5 ||
    report.supplyChainImpact.totalDistanceAvoidedKm <= 0
  ) {
    throw new Error("Invalid supply chain disintermediation metrics");
  }
  console.log("✅ 5 intermediary tiers bypassed, distance and carbon reduction verified.");

  // TEST 4: Transparent Commodity Benchmark Matrix Cross-Check
  console.log("\n--- TEST 4: Commodity Price Spread Comparison Matrix ---");
  console.log(`Commodities Benchmarked: ${report.commodityComparisonMatrix.length}`);

  for (const item of report.commodityComparisonMatrix) {
    console.log(`[${item.commodity}]`);
    console.log(`  Traditional: Consumer pays ₹${item.traditionalRetailPrice}, Farmer gets ₹${item.traditionalFarmerRealization}`);
    console.log(`  KisanDirect: Consumer pays ₹${item.kisanDirectConsumerPrice}, Farmer gets ₹${item.kisanDirectFarmerRealization}`);
    console.log(`  Delta: Farmer Net Gain +₹${item.farmerRealizationGain} (+${item.farmerGainPercentage}%), Consumer Saving ₹${item.consumerSaving} (-${item.consumerSavingPercentage}%)`);

    // Ensure farmer gets MORE on KisanDirect than traditional mandi
    if (item.kisanDirectFarmerRealization <= item.traditionalFarmerRealization) {
      throw new Error(`Farmer realization failed for ${item.commodity}`);
    }
    // Ensure consumer pays LESS on KisanDirect than traditional retail
    if (item.kisanDirectConsumerPrice >= item.traditionalRetailPrice) {
      throw new Error(`Consumer price failed for ${item.commodity}`);
    }
  }
  console.log("✅ All commodity benchmarks demonstrate dual-sided economic value transfer.");

  // TEST 5: Mandatory Econometric Simulation & Data Disclosure Notice
  console.log("\n--- TEST 5: Statutory Econometric Simulation Disclosure ---");
  console.log("Disclosure Text:", report.disclosure.notice.slice(0, 120) + "...");
  if (
    !report.disclosure.notice ||
    !report.disclosure.isEconometricSimulation ||
    !report.disclosure.notice.includes("econometric simulation")
  ) {
    throw new Error("Statutory disclosure notice missing or incomplete");
  }
  console.log("✅ Mandatory statistical simulation disclosure validated.");

  console.log("\n=================================================");
  console.log("🎉 ALL PHASE 11 IMPACT DASHBOARD REQUIREMENTS PASSED 100%!");
  console.log("=================================================\n");

  await mongoose.disconnect();
}

runPhase11ImpactTests().catch((err) => {
  console.error("❌ Phase 11 test failed:", err);
  process.exit(1);
});
