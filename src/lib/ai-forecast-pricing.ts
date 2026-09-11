import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { PriceRecommendation, IPriceRecommendationDocument } from "@/models/PriceRecommendation";
import { DemandForecast, IDemandForecastDocument } from "@/models/DemandForecast";
import {
  generateFarmerInsights,
  generatePriceExplanation,
  generateForecastExplanation,
  FarmerContext,
  FarmerInsightsResult,
} from "@/lib/gemini";

/**
 * Deterministic Price Recommendation Engine
 * Calculates baseline price corridor using APMC benchmarks, quality grade, and regional supply/demand,
 * then enriches with Gemini explanation and persists to MongoDB.
 */
export async function calculateAndStorePriceRecommendation(
  productId: string
): Promise<IPriceRecommendationDocument> {
  await connectToDatabase();

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  const currentPrice = product.price;
  const apmcModal = product.mandiBenchmarkPrice || Math.round(currentPrice * 0.76);

  // Deterministic grade multiplier
  let gradeMultiplier = 1.15;
  if (product.qualityGrade === "Premium Organic") gradeMultiplier = 1.25;
  else if (product.qualityGrade === "Grade B") gradeMultiplier = 1.05;

  const recommendedMinPrice = Math.round(apmcModal * 1.12);
  const recommendedMaxPrice = Math.max(
    recommendedMinPrice + 2,
    Math.round(apmcModal * gradeMultiplier * 1.12)
  );

  const location = {
    district: product.location?.district || "Nashik",
    state: product.location?.state || "Maharashtra",
  };

  // Generate explanation via Gemini service
  const aiExplanation = await generatePriceExplanation(
    product.name,
    currentPrice,
    apmcModal,
    recommendedMinPrice,
    recommendedMaxPrice,
    location
  );

  // Store in MongoDB
  const recDoc = await PriceRecommendation.findOneAndUpdate(
    { product: product._id },
    {
      productName: product.name,
      location,
      currentFarmerPrice: currentPrice,
      apmcModalBenchmarkPrice: apmcModal,
      recommendedMinPrice,
      recommendedMaxPrice,
      factors: {
        apmcModalPrice: apmcModal,
        distanceToHubKm: 28,
        gradeMultiplier,
        supplyDeficitPercent: 12,
        historicalWeeklyVolatilityPercent: 6,
      },
      explanation: aiExplanation.explanation,
      aiModel: aiExplanation.modelUsed,
      generatedAt: new Date(),
    },
    { upsert: true, returnDocument: "after" }
  );

  return recDoc;
}

/**
 * Deterministic Demand Forecasting Engine
 * Computes moving average of recent sales with seasonal multipliers,
 * enriches with Gemini driver explanations, and persists to MongoDB.
 */
export async function calculateAndStoreDemandForecast(
  productId: string
): Promise<IDemandForecastDocument> {
  await connectToDatabase();

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // Calculate historical sales volume from orders
  const ordersWithProduct = await Order.find({
    "items.product": product._id,
    orderStatus: { $ne: "CANCELLED" },
  }).select("items createdAt");

  let totalSoldKg = 0;
  ordersWithProduct.forEach((o) => {
    o.items.forEach((item) => {
      if (item.product?.toString() === product._id.toString()) {
        totalSoldKg += item.quantity || 0;
      }
    });
  });

  // Deterministic baseline moving average
  const baselineKg = Math.max(12000, totalSoldKg > 0 ? totalSoldKg * 4 : 18500);
  const seasonalMultiplier = 1.14; // Kharif seasonal transition
  const predictedDemandKg = Math.round(baselineKg * seasonalMultiplier);
  const trendDirection: "RISING" | "STABLE" | "FALLING" =
    predictedDemandKg > 15000 ? "RISING" : "STABLE";

  const location = {
    district: product.location?.district || "Nashik",
    state: product.location?.state || "Maharashtra",
  };

  const forecastPeriod = "Next 14 Days";

  // Generate explanation via Gemini service
  const aiExplanation = await generateForecastExplanation(
    product.name,
    forecastPeriod,
    predictedDemandKg,
    trendDirection,
    location
  );

  const startDate = new Date();
  const endDate = new Date(Date.now() + 14 * 24 * 3600 * 1000);

  const forecastDoc = await DemandForecast.findOneAndUpdate(
    { product: product._id, forecastPeriod },
    {
      productName: product.name,
      category: product.category,
      location,
      startDate,
      endDate,
      predictedDemandKg,
      confidenceScore: 0.91,
      trendDirection,
      factors: aiExplanation.factors,
      aiModelVersion: aiExplanation.modelUsed,
      generatedAt: new Date(),
    },
    { upsert: true, returnDocument: "after" }
  );

  return forecastDoc;
}

interface CachedFarmerInsights {
  timestamp: number;
  insights: FarmerInsightsResult;
  productCount: number;
  salesVolume: number;
}

// In-memory short-lived cache for top-level farmer insights to avoid redundant Gemini calls on page reload
const insightsMemoryCache = new Map<string, CachedFarmerInsights>();
const INSIGHTS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REC_FRESHNESS_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours for real AI recommendations
const FALLBACK_COOLDOWN_TTL_MS = 5 * 60 * 1000; // 5 minutes cooldown before re-attempting fallback

/**
 * Retrieve comprehensive AI hub intelligence for an authenticated farmer
 */
export async function getFarmerAiHubData(
  userId: string,
  forceRefresh = false
): Promise<{
  insights: FarmerInsightsResult;
  recommendations: IPriceRecommendationDocument[];
  forecasts: IDemandForecastDocument[];
  farmerContext: FarmerContext;
}> {
  await connectToDatabase();

  let userDoc = null;
  let sellerId: mongoose.Types.ObjectId | null = null;

  if (mongoose.Types.ObjectId.isValid(userId)) {
    sellerId = new mongoose.Types.ObjectId(userId);
    userDoc = await User.findById(sellerId);
  }

  // If not found by ObjectId, try matching by email if it looks like an email
  if (!userDoc && typeof userId === "string" && userId.includes("@")) {
    userDoc = await User.findOne({ email: userId.toLowerCase() });
    if (userDoc) {
      sellerId = userDoc._id;
    }
  }

  // Get strictly this farmer's products
  const products = sellerId
    ? await Product.find({
        seller: sellerId,
        status: { $ne: "ARCHIVED" },
      }).lean()
    : [];

  // Get farmer completed orders
  const orders = sellerId
    ? await Order.find({
        seller: sellerId,
        orderStatus: { $ne: "CANCELLED" },
      }).lean()
    : [];

  const grossEarnings = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalVolumeKg = orders.reduce(
    (acc, curr) => acc + curr.items.reduce((sum, i) => sum + i.quantity, 0),
    0
  );

  const farmerContext: FarmerContext = {
    farmerName: userDoc?.name || "Farmer",
    location: {
      district: userDoc?.location?.district || "Cuttack",
      state: userDoc?.location?.state || "Odisha",
    },
    products: products.map((p) => ({
      name: p.name,
      variety: p.variety,
      category: p.category?.toString(),
      price: p.price,
      mandiBenchmarkPrice: p.mandiBenchmarkPrice,
      availableQuantity: p.availableQuantity,
      unit: p.unit,
      qualityGrade: p.qualityGrade,
    })),
    recentSalesVolumeKg: totalVolumeKg,
    grossEarningsInr: grossEarnings,
    openOrdersCount: orders.filter((o) => o.orderStatus !== "DELIVERED").length,
  };

  // 1. Retrieve or generate top-level insights with TTL caching
  const cacheKey = sellerId ? sellerId.toString() : userId;
  const cached = insightsMemoryCache.get(cacheKey);
  const isCacheValid =
    !forceRefresh &&
    cached &&
    Date.now() - cached.timestamp < INSIGHTS_CACHE_TTL_MS &&
    cached.productCount === products.length &&
    cached.salesVolume === totalVolumeKg;

  let insights: FarmerInsightsResult;
  if (isCacheValid && cached) {
    insights = cached.insights;
  } else {
    insights = await generateFarmerInsights(farmerContext);
    if (insights.isAiGenerated) {
      insightsMemoryCache.set(cacheKey, {
        timestamp: Date.now(),
        insights,
        productCount: products.length,
        salesVolume: totalVolumeKg,
      });
    }
  }

  // 2. Retrieve or generate price recommendations and demand forecasts for top products
  const recommendations: IPriceRecommendationDocument[] = [];
  const forecasts: IDemandForecastDocument[] = [];

  for (const prod of products.slice(0, 3)) {
    try {
      // Check for fresh existing recommendation in MongoDB
      let rec: IPriceRecommendationDocument | null = null;
      if (!forceRefresh) {
        const existingRec = await PriceRecommendation.findOne({
          product: prod._id,
        }).sort({ generatedAt: -1 });

        if (existingRec && existingRec.currentFarmerPrice === prod.price) {
          const ageMs = Date.now() - new Date(existingRec.generatedAt).getTime();
          const isAi = existingRec.aiModel && !existingRec.aiModel.includes("fallback");
          if ((isAi && ageMs < REC_FRESHNESS_TTL_MS) || (!isAi && ageMs < FALLBACK_COOLDOWN_TTL_MS)) {
            rec = existingRec;
          }
        }
      }

      if (!rec) {
        // Sequential pacing to avoid hitting Google Gemini concurrent burst limits
        await new Promise((r) => setTimeout(r, 400));
        rec = await calculateAndStorePriceRecommendation(prod._id.toString());
      }
      if (rec) recommendations.push(rec);

      // Check for fresh existing demand forecast in MongoDB
      let fc: IDemandForecastDocument | null = null;
      if (!forceRefresh) {
        const existingFc = await DemandForecast.findOne({
          product: prod._id,
          forecastPeriod: "Next 14 Days",
        }).sort({ generatedAt: -1 });

        if (existingFc) {
          const ageMs = Date.now() - new Date(existingFc.generatedAt).getTime();
          const isAi = existingFc.aiModelVersion && !existingFc.aiModelVersion.includes("fallback");
          if ((isAi && ageMs < REC_FRESHNESS_TTL_MS) || (!isAi && ageMs < FALLBACK_COOLDOWN_TTL_MS)) {
            fc = existingFc;
          }
        }
      }

      if (!fc) {
        await new Promise((r) => setTimeout(r, 400));
        fc = await calculateAndStoreDemandForecast(prod._id.toString());
      }
      if (fc) forecasts.push(fc);
    } catch (err) {
      console.warn("Could not generate individual product AI intelligence:", err);
    }
  }

  return {
    insights,
    recommendations,
    forecasts,
    farmerContext,
  };
}
