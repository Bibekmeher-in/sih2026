import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { BulkRequirement } from "@/models/BulkRequirement";
import {
  getVerifiedMarketBenchmark,
  getAuthenticMarketHistory,
  GovMandiRecord,
  HistoricalPriceEntry,
} from "@/lib/gov-market-data-service";
import { DEFAULT_PRICING_CONFIG } from "@/lib/pricing-rules-config";

export interface DeterministicPricingInput {
  cropName: string;
  variety?: string;
  quantity: number;
  qualityGrade: "Grade A" | "Grade B" | "Grade C" | "Premium Organic" | string;
  district: string;
  state: string;
  targetMarket?: string;
  transitDistanceKm?: number;
  harvestDate?: string;
  farmerAskingPrice?: number;
  productId?: string;
}

export interface CalculationStep {
  stepName: string;
  factor: string;
  adjustment: string;
  resultingRate: number;
}

export interface DeterministicPricingResult {
  productName: string;
  variety: string;
  quantity: number;
  qualityGrade: string;
  location: {
    district: string;
    state: string;
  };
  marketBenchmark: GovMandiRecord;
  marketplaceAverage: number;
  demandLevel: "HIGH" | "MODERATE" | "LOW";
  demandScore: number;
  supplyLevel: "HIGH" | "MODERATE" | "LOW";
  supplyScore: number;
  buyerInquiriesCount: number;
  logisticsCostPerKg: number;
  logisticsVehicleTier: string;
  recommendedMinPrice: number;
  recommendedMaxPrice: number;
  targetPrice: number;
  confidenceScore: number;
  dataConfidenceLabel: string;
  calculationSteps: CalculationStep[];
  historyTrend: HistoricalPriceEntry[];
  insufficientHistory: boolean;
  factors: {
    apmcModalPrice: number;
    distanceToHubKm: number;
    gradeMultiplier: number;
    supplyDeficitPercent: number;
    demandFactorText: string;
    qualityFactorText: string;
    logisticsFactorText: string;
    supplyFactorText: string;
  };
  netRealization: {
    sellingPricePerKg: number;
    quantity: number;
    gross: number;
    logistics: number;
    platformFee: number;
    net: number;
  };
  traditionalComparison: {
    traditionalRatePerKg: number;
    traditionalNet: number;
    kisanDirectAdvantagePerKg: number;
    kisanDirectTotalAdvantage: number;
  };
}

/**
 * Deterministic Price Recommendation Engine
 *
 * Guaranteed Architecture:
 * 1. Government APMC Mandi Benchmark is PRESERVED as the baseline reality (Min, Modal, Max).
 * 2. Quality sorting, lot volume, freshness urgency, and supply/demand deterministically
 *    determine the KisanDirect Farm-Gate Price Corridor.
 * 3. Freight logistics rates derive from configurable vehicle tier matrix.
 * 4. Step-by-step explainability is produced for transparent inspection.
 */
export async function calculateDeterministicPrice(
  input: DeterministicPricingInput
): Promise<DeterministicPricingResult> {
  await connectToDatabase();

  const {
    cropName,
    variety = "",
    quantity = 500,
    qualityGrade = "Grade A",
    district = "Ganjam",
    state = "Odisha",
    targetMarket = "",
    transitDistanceKm = 45,
    harvestDate,
  } = input;

  const safeQuantity = Math.max(1, Number(quantity) || 500);
  const safeDistance = Math.max(5, Number(transitDistanceKm) || 45);

  // 1. Retrieve Authentic Government APMC Benchmark
  const marketBenchmark = await getVerifiedMarketBenchmark(
    cropName,
    district,
    state,
    targetMarket,
    variety
  );
  const modalPrice = marketBenchmark.modalPrice;

  // 2. Query MongoDB for active marketplace listings to calculate real marketplace average & supply
  let marketplaceAverage = modalPrice;
  let activeListingsCount = 0;
  let hasMarketplaceData = false;

  try {
    const matchingProducts = await Product.find({
      name: { $regex: new RegExp(cropName.trim(), "i") },
      status: "AVAILABLE",
    })
      .select("price location")
      .limit(20)
      .lean();

    activeListingsCount = matchingProducts.length;
    if (matchingProducts.length > 0) {
      const sum = matchingProducts.reduce((acc, p) => acc + (p.price || 0), 0);
      marketplaceAverage = Math.round(sum / matchingProducts.length);
      hasMarketplaceData = true;
    } else {
      marketplaceAverage = Math.round(modalPrice * 1.06);
    }
  } catch (err) {
    console.warn("Could not query marketplace products for average:", err);
    marketplaceAverage = Math.round(modalPrice * 1.06);
  }

  // 3. Query MongoDB for active buyer requirements (Demand Factor)
  let buyerInquiriesCount = 0;
  let hasDemandData = false;

  try {
    const buyerReqs = await BulkRequirement.find({
      crop: { $regex: new RegExp(cropName.trim(), "i") },
      status: { $in: ["OPEN", "MATCHED"] },
    })
      .limit(10)
      .lean();

    buyerInquiriesCount = buyerReqs.length;
    if (buyerReqs.length > 0) hasDemandData = true;
  } catch (err) {
    console.warn("Could not query bulk requirements for demand:", err);
  }

  // ---------------------------------------------------------------------------
  // STEP-BY-STEP DETERMINISTIC CALCULATIONS (Driven by Configurable Rules)
  // ---------------------------------------------------------------------------
  const calculationSteps: CalculationStep[] = [];
  let runningRate = modalPrice;

  calculationSteps.push({
    stepName: "Government APMC Spot Benchmark",
    factor: `${marketBenchmark.marketName} (${marketBenchmark.source})`,
    adjustment: `Base Modal Rate: ₹${modalPrice.toFixed(2)}/kg`,
    resultingRate: Number(runningRate.toFixed(2)),
  });

  // Step 2: Quality Sorting Adjustment
  const qualityRule =
    DEFAULT_PRICING_CONFIG.qualityMultipliers[qualityGrade] ||
    DEFAULT_PRICING_CONFIG.qualityMultipliers["Grade A"];
  const qualityAdjustmentPct = qualityRule.multiplier - 1.0;
  const qualityAdjustmentAmount = Number((modalPrice * qualityAdjustmentPct).toFixed(2));
  runningRate += qualityAdjustmentAmount;

  calculationSteps.push({
    stepName: `Quality Sorting: ${qualityRule.label}`,
    factor: qualityRule.description,
    adjustment: `${qualityAdjustmentPct >= 0 ? "+" : ""}${(qualityAdjustmentPct * 100).toFixed(0)}% (${qualityAdjustmentAmount >= 0 ? "+" : ""}₹${qualityAdjustmentAmount.toFixed(2)}/kg)`,
    resultingRate: Number(runningRate.toFixed(2)),
  });

  // Step 3: Quantity Volume Tier Adjustment
  const volumeTier =
    DEFAULT_PRICING_CONFIG.volumeTiers.find((t) => safeQuantity <= t.maxKg) ||
    DEFAULT_PRICING_CONFIG.volumeTiers[1];
  const volumeAdjustmentPct = volumeTier.adjustmentPercent;
  const volumeAdjustmentAmount = Number((modalPrice * volumeAdjustmentPct).toFixed(2));
  runningRate += volumeAdjustmentAmount;

  calculationSteps.push({
    stepName: `Volume Tier (${safeQuantity.toLocaleString("en-IN")} kg)`,
    factor: volumeTier.tierName,
    adjustment: `${volumeAdjustmentPct >= 0 ? "+" : ""}${(volumeAdjustmentPct * 100).toFixed(0)}% (${volumeAdjustmentAmount >= 0 ? "+" : ""}₹${volumeAdjustmentAmount.toFixed(2)}/kg)`,
    resultingRate: Number(runningRate.toFixed(2)),
  });

  // Step 4: Freshness & Harvest Date Urgency
  let freshnessAdjustmentPct = 0;
  let freshnessDescription = "Standard harvest dispatch window";

  if (harvestDate) {
    const harvestTime = new Date(harvestDate).getTime();
    const nowTime = new Date().setHours(0, 0, 0, 0);
    const daysDiff = Math.round((harvestTime - nowTime) / (24 * 60 * 60 * 1000));

    if (daysDiff >= 0 && daysDiff <= DEFAULT_PRICING_CONFIG.freshnessRules.peakFreshnessDays) {
      freshnessAdjustmentPct = DEFAULT_PRICING_CONFIG.freshnessRules.peakFreshnessAdjustment; // +3%
      freshnessDescription = "Harvested today/tomorrow: Peak freshness premium";
    } else if (daysDiff < -1) {
      const daysPast = Math.abs(daysDiff);
      const depreciation = Math.min(
        DEFAULT_PRICING_CONFIG.freshnessRules.maxAgingDepreciationPercent,
        (daysPast - 1) * DEFAULT_PRICING_CONFIG.freshnessRules.agingDepreciationDailyPercent
      );
      freshnessAdjustmentPct = -depreciation;
      freshnessDescription = `Harvested ${daysPast} days ago: Shelf-life urgency discount`;
    } else if (daysDiff > 1) {
      freshnessAdjustmentPct = 0.0;
      freshnessDescription = `Advance harvest booking (${daysDiff} days ahead)`;
    }
  }

  const freshnessAdjustmentAmount = Number((modalPrice * freshnessAdjustmentPct).toFixed(2));
  runningRate += freshnessAdjustmentAmount;

  calculationSteps.push({
    stepName: "Harvest Freshness & Shelf-Life",
    factor: freshnessDescription,
    adjustment: `${freshnessAdjustmentPct >= 0 ? "+" : ""}${(freshnessAdjustmentPct * 100).toFixed(0)}% (${freshnessAdjustmentAmount >= 0 ? "+" : ""}₹${freshnessAdjustmentAmount.toFixed(2)}/kg)`,
    resultingRate: Number(runningRate.toFixed(2)),
  });

  // Step 5: Regional Supply & Demand Market Balance
  let demandLevel: "HIGH" | "MODERATE" | "LOW" = "MODERATE";
  let demandScore = 70;
  let demandAdjustmentPct = 0;

  if (buyerInquiriesCount >= DEFAULT_PRICING_CONFIG.marketDemandMultipliers.highDemandRfqThreshold) {
    demandLevel = "HIGH";
    demandScore = 88;
    demandAdjustmentPct = DEFAULT_PRICING_CONFIG.marketDemandMultipliers.highDemandAdjustment; // +5%
  } else if (buyerInquiriesCount === 1) {
    demandLevel = "MODERATE";
    demandScore = 74;
    demandAdjustmentPct = DEFAULT_PRICING_CONFIG.marketDemandMultipliers.moderateDemandAdjustment; // +2%
  } else {
    demandLevel = "LOW";
    demandScore = 55;
    demandAdjustmentPct = DEFAULT_PRICING_CONFIG.marketDemandMultipliers.lowDemandAdjustment;
  }

  let supplyLevel: "HIGH" | "MODERATE" | "LOW" = "MODERATE";
  let supplyScore = 50;
  let supplyAdjustmentPct = 0;

  if (activeListingsCount >= DEFAULT_PRICING_CONFIG.supplyGlutRules.supplyGlutListingCount) {
    supplyLevel = "HIGH";
    supplyScore = 85;
    supplyAdjustmentPct = DEFAULT_PRICING_CONFIG.supplyGlutRules.supplyGlutAdjustment; // -4%
  } else if (activeListingsCount <= DEFAULT_PRICING_CONFIG.supplyGlutRules.supplyDeficitListingCount) {
    supplyLevel = "LOW";
    supplyScore = 25;
    supplyAdjustmentPct = DEFAULT_PRICING_CONFIG.supplyGlutRules.supplyDeficitAdjustment; // +4%
  } else {
    supplyLevel = "MODERATE";
    supplyScore = 50;
    supplyAdjustmentPct = 0;
  }

  const netMarketBalancePct = demandAdjustmentPct + supplyAdjustmentPct;
  const netMarketBalanceAmount = Number((modalPrice * netMarketBalancePct).toFixed(2));
  runningRate += netMarketBalanceAmount;

  calculationSteps.push({
    stepName: "Regional Market Balance",
    factor: `Demand: ${demandLevel} (${buyerInquiriesCount} RFQs) | Supply: ${supplyLevel} (${activeListingsCount} listings)`,
    adjustment: `${netMarketBalancePct >= 0 ? "+" : ""}${(netMarketBalancePct * 100).toFixed(0)}% (${netMarketBalanceAmount >= 0 ? "+" : ""}₹${netMarketBalanceAmount.toFixed(2)}/kg)`,
    resultingRate: Number(runningRate.toFixed(2)),
  });

  // Step 6: Configurable Freight Logistics Overhead
  const logisticsRule =
    DEFAULT_PRICING_CONFIG.logisticsFreightRules.find((r) => safeQuantity <= r.maxCapacityKg) ||
    DEFAULT_PRICING_CONFIG.logisticsFreightRules[1];

  const calculatedPerKgFreight =
    logisticsRule.baseFare / safeQuantity + safeDistance * logisticsRule.perKmPerKgRate;
  const logisticsCostPerKg = Number(
    Math.max(logisticsRule.minPerKgCost, calculatedPerKgFreight).toFixed(2)
  );

  calculationSteps.push({
    stepName: "Freight Logistics Rate",
    factor: `${logisticsRule.vehicleType} across ${safeDistance} km`,
    adjustment: `Freight Rate: ₹${logisticsCostPerKg.toFixed(2)}/kg`,
    resultingRate: Number(runningRate.toFixed(2)),
  });

  // Step 7: Recommended Corridor & Target Price
  const targetPrice = Math.max(
    marketBenchmark.minPrice,
    Math.round(runningRate)
  );

  const recommendedMinPrice = Math.max(
    marketBenchmark.minPrice,
    Math.round(targetPrice * 0.94)
  );

  const recommendedMaxPrice = Math.max(
    recommendedMinPrice + 2,
    Math.round(targetPrice * 1.07)
  );

  calculationSteps.push({
    stepName: "KisanDirect Fair Corridor",
    factor: "Recommended selling corridor for farm-gate lot listing",
    adjustment: `Corridor: ₹${recommendedMinPrice} – ₹${recommendedMaxPrice}/kg`,
    resultingRate: targetPrice,
  });

  // 8. Authentic Data Confidence Score
  let confidence = 0;
  if (marketBenchmark.isLiveFeed) confidence += 30;
  else confidence += 25; // verified stored APMC benchmark
  if (hasMarketplaceData) confidence += 20;
  if (hasDemandData) confidence += 15;
  if (district && marketBenchmark.district.toLowerCase() === district.toLowerCase()) confidence += 20;
  else confidence += 10;

  const confidenceScore = Math.min(95, confidence);
  const dataConfidenceLabel =
    confidenceScore >= 75
      ? "High Confidence"
      : confidenceScore >= 50
      ? "Moderate Confidence"
      : "Limited data";

  // 9. Real Price History from MongoDB
  const historyData = await getAuthenticMarketHistory(cropName, district, targetMarket);

  // 10. Estimated Farmer Net Realization
  const gross = targetPrice * safeQuantity;
  const totalLogistics = Math.round(logisticsCostPerKg * safeQuantity);
  const platformFee = 0; // zero commission farm gate
  const net = gross - totalLogistics - platformFee;

  // 11. Traditional Mandi Comparison (7% APMC cess + 5% transit shrinkage + commission)
  const traditionalDeductions = modalPrice * 0.12 + 0.75;
  const traditionalRatePerKg = Math.max(5, Number((modalPrice - traditionalDeductions).toFixed(1)));
  const traditionalNet = Math.round(traditionalRatePerKg * safeQuantity);

  const kisanDirectAdvantagePerKg = Number((targetPrice - traditionalRatePerKg).toFixed(1));
  const kisanDirectTotalAdvantage = Math.max(0, net - traditionalNet);

  return {
    productName: cropName,
    variety: marketBenchmark.variety,
    quantity: safeQuantity,
    qualityGrade,
    location: {
      district,
      state,
    },
    marketBenchmark,
    marketplaceAverage,
    demandLevel,
    demandScore,
    supplyLevel,
    supplyScore,
    buyerInquiriesCount,
    logisticsCostPerKg,
    logisticsVehicleTier: logisticsRule.vehicleType,
    recommendedMinPrice,
    recommendedMaxPrice,
    targetPrice,
    confidenceScore,
    dataConfidenceLabel,
    calculationSteps,
    historyTrend: historyData.history,
    insufficientHistory: historyData.insufficientHistory,
    factors: {
      apmcModalPrice: modalPrice,
      distanceToHubKm: safeDistance,
      gradeMultiplier: qualityRule.multiplier,
      supplyDeficitPercent: supplyLevel === "LOW" ? 14 : supplyLevel === "MODERATE" ? 6 : 0,
      demandFactorText:
        demandLevel === "HIGH"
          ? `High Demand (${buyerInquiriesCount} active regional buyer requirements)`
          : demandLevel === "MODERATE"
          ? `Moderate Demand (${buyerInquiriesCount} active buyer RFQs)`
          : `Standard consumer demand across ${district} distribution hubs`,
      qualityFactorText: qualityRule.description,
      logisticsFactorText: `₹${logisticsCostPerKg}/kg freight (${logisticsRule.vehicleType}, ${safeDistance} km)`,
      supplyFactorText:
        supplyLevel === "HIGH"
          ? `Elevated regional supply (${activeListingsCount} active listings in hub)`
          : supplyLevel === "LOW"
          ? `Tight local supply (${activeListingsCount} listings recorded)`
          : "Normal regional mandi arrivals recorded",
    },
    netRealization: {
      sellingPricePerKg: targetPrice,
      quantity: safeQuantity,
      gross,
      logistics: totalLogistics,
      platformFee,
      net,
    },
    traditionalComparison: {
      traditionalRatePerKg,
      traditionalNet,
      kisanDirectAdvantagePerKg,
      kisanDirectTotalAdvantage,
    },
  };
}
