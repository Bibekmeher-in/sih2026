import fs from "fs";
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
} catch {
  // ignore
}
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/KISANOVA";
}

import mongoose from "mongoose";
import { calculateDeterministicPrice } from "../src/lib/price-analysis-engine.ts";
import { generateStructuredPriceAdvice } from "../src/lib/gemini.ts";
import { getVerifiedMarketBenchmark } from "../src/lib/gov-market-data-service.ts";

async function runAllTests() {
  console.log("================================================================================");
  console.log("KISANOVA PRICE DISCOVERY ENGINE — 8 MANDATORY TEST CASES VERIFICATION");
  console.log("================================================================================\n");

  await mongoose.connect("mongodb://127.0.0.1:27017/KISANOVA");
  console.log(" Connected to MongoDB.\n");

  let passed = 0;
  let total = 8;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Tomato, 500 kg, Grade A, Ganjam
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Tomato, 500 kg, Grade A, Ganjam ---");
    const test1 = await calculateDeterministicPrice({
      cropName: "Tomato",
      variety: "Hybrid Red Table",
      quantity: 500,
      qualityGrade: "Grade A",
      district: "Ganjam",
      state: "Odisha",
      transitDistanceKm: 45,
      harvestDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    console.log(`  Modal Mandi Benchmark: ₹${test1.marketBenchmark.modalPrice}/kg (${test1.marketBenchmark.marketName})`);
    console.log(`  Recommended Corridor:  ₹${test1.recommendedMinPrice} – ₹${test1.recommendedMaxPrice}/kg`);
    console.log(`  Target Price:          ₹${test1.targetPrice}/kg`);
    console.log(`  Logistics Freight:     ₹${test1.logisticsCostPerKg}/kg (${test1.logisticsVehicleTier})`);
    console.log(`  Net Realization:       ₹${test1.netRealization.net} (gross: ₹${test1.netRealization.gross})`);
    console.log(`  Data Confidence:       ${test1.dataConfidenceLabel} (${test1.confidenceScore}%)`);
    console.log(`  Explain Steps Count:   ${test1.calculationSteps.length}`);
    if (test1.targetPrice > 0 && test1.marketBenchmark.modalPrice > 0) {
      console.log("  [PASS] Test 1 completed successfully.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test 1 failed validation.\n");
    }

    // -------------------------------------------------------------------------
    // TEST 2: Tomato, 50 kg, Grade C, Ganjam
    // -------------------------------------------------------------------------
    console.log("--- TEST 2: Tomato, 50 kg, Grade C, Ganjam ---");
    const test2 = await calculateDeterministicPrice({
      cropName: "Tomato",
      variety: "Hybrid Red Table",
      quantity: 50,
      qualityGrade: "Grade C",
      district: "Ganjam",
      state: "Odisha",
      transitDistanceKm: 45,
      harvestDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    console.log(`  Modal Mandi Benchmark: ₹${test2.marketBenchmark.modalPrice}/kg`);
    console.log(`  Recommended Corridor:  ₹${test2.recommendedMinPrice} – ₹${test2.recommendedMaxPrice}/kg`);
    console.log(`  Target Price:          ₹${test2.targetPrice}/kg`);
    console.log(`  Logistics Freight:     ₹${test2.logisticsCostPerKg}/kg (${test2.logisticsVehicleTier})`);
    console.log(`  Comparison vs Test 1:  Test 1 Target=₹${test1.targetPrice} vs Test 2 Target=₹${test2.targetPrice}`);

    const isDifferent = test1.targetPrice !== test2.targetPrice;
    if (isDifferent) {
      console.log("  [PASS] Test 2: Results are distinctly different from Test 1 (Grade C + 50kg lot).\n");
      passed++;
    } else {
      console.error("  [FAIL] Test 2: Results blindly remained identical to Test 1!\n");
    }

    // -------------------------------------------------------------------------
    // TEST 3: Change Tomato -> Potato
    // -------------------------------------------------------------------------
    console.log("--- TEST 3: Change Tomato -> Potato ---");
    const test3 = await calculateDeterministicPrice({
      cropName: "Potato",
      variety: "Jyoti Wholesale",
      quantity: 500,
      qualityGrade: "Grade A",
      district: "Cuttack",
      state: "Odisha",
      transitDistanceKm: 45,
    });
    console.log(`  Crop Benchmark:        ${test3.productName} at ${test3.marketBenchmark.marketName}`);
    console.log(`  Modal Mandi Benchmark: ₹${test3.marketBenchmark.modalPrice}/kg`);
    console.log(`  Recommended Corridor:  ₹${test3.recommendedMinPrice} – ₹${test3.recommendedMaxPrice}/kg`);
    console.log(`  Target Price:          ₹${test3.targetPrice}/kg`);

    if (test3.productName.toLowerCase() === "potato" && test3.marketBenchmark.modalPrice === 21) {
      console.log("  [PASS] Test 3: Engine correctly switched to authentic Potato APMC data (₹21/kg modal at Malgodown).\n");
      passed++;
    } else {
      console.error("  [FAIL] Test 3 did not use correct Potato APMC benchmark.\n");
    }

    // -------------------------------------------------------------------------
    // TEST 4: Change Ganjam -> Cuttack / Balasore (Location Sensitivity)
    // -------------------------------------------------------------------------
    console.log("--- TEST 4: Change Location Ganjam -> Balasore for Onion ---");
    const test4 = await calculateDeterministicPrice({
      cropName: "Onion",
      quantity: 500,
      qualityGrade: "Grade A",
      district: "Balasore",
      state: "Odisha",
      transitDistanceKm: 30,
    });
    console.log(`  District & Market:     ${test4.location.district} — ${test4.marketBenchmark.marketName}`);
    console.log(`  Modal Mandi Benchmark: ₹${test4.marketBenchmark.modalPrice}/kg`);
    console.log(`  Recommended Corridor:  ₹${test4.recommendedMinPrice} – ₹${test4.recommendedMaxPrice}/kg`);

    if (test4.location.district === "Balasore" && test4.marketBenchmark.marketName.includes("Balasore")) {
      console.log("  [PASS] Test 4: Relevant regional market data for Balasore was applied.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test 4 did not apply location specific data.\n");
    }

    // -------------------------------------------------------------------------
    // TEST 5: Change quantity from 100 kg -> 1,000 kg (Volume Effect)
    // -------------------------------------------------------------------------
    console.log("--- TEST 5: Volume Sensitivity (100 kg vs 1,000 kg Tomato) ---");
    const test5Small = await calculateDeterministicPrice({
      cropName: "Tomato",
      quantity: 100,
      qualityGrade: "Grade A",
      district: "Ganjam",
      state: "Odisha",
      transitDistanceKm: 45,
    });
    const test5Bulk = await calculateDeterministicPrice({
      cropName: "Tomato",
      quantity: 1000,
      qualityGrade: "Grade A",
      district: "Ganjam",
      state: "Odisha",
      transitDistanceKm: 45,
    });
    console.log(`  100 kg Lot:   Target=₹${test5Small.targetPrice}/kg | Freight=₹${test5Small.logisticsCostPerKg}/kg (${test5Small.logisticsVehicleTier})`);
    console.log(`  1000 kg Lot:  Target=₹${test5Bulk.targetPrice}/kg | Freight=₹${test5Bulk.logisticsCostPerKg}/kg (${test5Bulk.logisticsVehicleTier})`);

    if (test5Small.targetPrice !== test5Bulk.targetPrice && test5Small.logisticsCostPerKg >= test5Bulk.logisticsCostPerKg) {
      console.log("  [PASS] Test 5: Quantity volume tier and vehicle freight matrix correctly applied.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test 5 did not apply quantity volume effect.\n");
    }

    // -------------------------------------------------------------------------
    // TEST 6: Change quality Grade A -> Grade C
    // -------------------------------------------------------------------------
    console.log("--- TEST 6: Quality Sensitivity (Grade A vs Grade C Tomato, 500 kg) ---");
    const test6GradeA = await calculateDeterministicPrice({
      cropName: "Tomato",
      quantity: 500,
      qualityGrade: "Grade A",
      district: "Ganjam",
      state: "Odisha",
      transitDistanceKm: 45,
    });
    const test6GradeC = await calculateDeterministicPrice({
      cropName: "Tomato",
      quantity: 500,
      qualityGrade: "Grade C",
      district: "Ganjam",
      state: "Odisha",
      transitDistanceKm: 45,
    });
    console.log(`  Grade A:  Target=₹${test6GradeA.targetPrice}/kg (Range ₹${test6GradeA.recommendedMinPrice} - ₹${test6GradeA.recommendedMaxPrice})`);
    console.log(`  Grade C:  Target=₹${test6GradeC.targetPrice}/kg (Range ₹${test6GradeC.recommendedMinPrice} - ₹${test6GradeC.recommendedMaxPrice})`);

    if (test6GradeA.targetPrice > test6GradeC.targetPrice) {
      console.log("  [PASS] Test 6: Grade C applies clear deterministic discount compared to Grade A.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test 6 did not differentiate Grade A vs Grade C.\n");
    }

    // -------------------------------------------------------------------------
    // TEST 7: Run two different analyses consecutively (Cache Integrity)
    // -------------------------------------------------------------------------
    console.log("--- TEST 7: Consecutive Analyses with Different Inputs ---");
    const callA = await calculateDeterministicPrice({
      cropName: "Tomato",
      quantity: 200,
      qualityGrade: "Grade A",
      district: "Ganjam",
      state: "Odisha",
    });
    const callB = await calculateDeterministicPrice({
      cropName: "Tomato",
      quantity: 900,
      qualityGrade: "Grade B",
      district: "Ganjam",
      state: "Odisha",
    });
    console.log(`  Call A (200kg Grade A): Target=₹${callA.targetPrice}/kg`);
    console.log(`  Call B (900kg Grade B): Target=₹${callB.targetPrice}/kg`);

    if (callA.targetPrice !== callB.targetPrice) {
      console.log("  [PASS] Test 7: Consecutive runs with changed parameters produce independent fresh results.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test 7 returned stale results.\n");
    }

    // -------------------------------------------------------------------------
    // TEST 8: Disable / Fail Gemini (Graceful Deterministic Resilience)
    // -------------------------------------------------------------------------
    console.log("--- TEST 8: Disable / Fail Gemini ---");
    const originalApiKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = ""; // intentionally clear key to simulate Gemini failure

    const test8Result = await calculateDeterministicPrice({
      cropName: "Tomato",
      quantity: 500,
      qualityGrade: "Grade A",
      district: "Ganjam",
      state: "Odisha",
    });

    const adviceFallback = await generateStructuredPriceAdvice({
      productName: test8Result.productName,
      variety: test8Result.variety,
      quantity: test8Result.quantity,
      qualityGrade: test8Result.qualityGrade,
      location: test8Result.location,
      marketMin: test8Result.marketBenchmark.minPrice,
      marketModal: test8Result.marketBenchmark.modalPrice,
      marketMax: test8Result.marketBenchmark.maxPrice,
      marketplaceAverage: test8Result.marketplaceAverage,
      recommendedMin: test8Result.recommendedMinPrice,
      recommendedMax: test8Result.recommendedMaxPrice,
      targetPrice: test8Result.targetPrice,
      demandLevel: test8Result.demandLevel,
      buyerInquiriesCount: test8Result.buyerInquiriesCount,
      logisticsCost: test8Result.logisticsCostPerKg,
    });

    console.log(`  Deterministic Pricing Engine: Target=₹${test8Result.targetPrice}/kg (Corridor ₹${test8Result.recommendedMinPrice} - ₹${test8Result.recommendedMaxPrice})`);
    console.log(`  Fallback AI Summary:          "${adviceFallback.summary}"`);
    console.log(`  isAiGenerated:                ${adviceFallback.isAiGenerated}`);
    console.log(`  Model Used:                   ${adviceFallback.modelUsed}`);

    process.env.GEMINI_API_KEY = originalApiKey; // restore key

    if (
      test8Result.targetPrice > 0 &&
      adviceFallback.summary === "AI explanation temporarily unavailable." &&
      adviceFallback.isAiGenerated === false
    ) {
      console.log("  [PASS] Test 8: Deterministic pricing continues working with explicit fallback notice.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test 8 failed resilience check.\n");
    }

    console.log("================================================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} / ${total} TESTS PASSED`);
    console.log("================================================================================");

    await mongoose.disconnect();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error("Fatal error during test suite:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runAllTests();
