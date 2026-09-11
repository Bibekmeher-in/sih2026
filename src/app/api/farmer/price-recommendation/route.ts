import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { PriceRecommendation } from "@/models/PriceRecommendation";
import { calculateDeterministicPrice } from "@/lib/price-analysis-engine";
import { generateStructuredPriceAdvice } from "@/lib/gemini";
import { getVerifiedMarketBenchmark } from "@/lib/gov-market-data-service";

export const dynamic = "force-dynamic";

const analyzePriceInputSchema = z.object({
  productId: z.string().optional(),
  cropName: z.string().min(1, "Produce / Crop name is required"),
  variety: z.string().optional().default(""),
  quantity: z.number().min(1, "Quantity must be at least 1").default(500),
  qualityGrade: z
    .enum(["Grade A", "Grade B", "Grade C", "Premium Organic"])
    .default("Grade A"),
  district: z.string().default("Ganjam"),
  state: z.string().default("Odisha"),
  targetMarket: z.string().optional().default(""),
  transitDistanceKm: z.number().min(1).max(2000).default(45),
  harvestDate: z.string().optional(),
  farmerAskingPrice: z.number().optional(),
  forceRefresh: z.boolean().optional(),
});

const RECENT_ANALYSIS_CACHE_MS = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/farmer/price-recommendation
 * Run deterministic calculation & Gemini enrichment for farm produce pricing
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.FPO)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = analyzePriceInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input parameters",
          errors: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const data = parsed.data;
    const farmerId = new mongoose.Types.ObjectId(user.id);

    // If productId provided, verify product exists and belongs to this seller
    let productDoc = null;
    if (data.productId && mongoose.Types.ObjectId.isValid(data.productId)) {
      productDoc = await Product.findById(data.productId);
      if (productDoc && productDoc.seller.toString() !== user.id && user.role !== USER_ROLES.ADMIN) {
        return NextResponse.json(
          { success: false, message: "Forbidden: You do not own this product listing" },
          { status: 403 }
        );
      }
    }

    // 1. Fetch current market benchmark timestamp for precise cache validation
    const marketBench = await getVerifiedMarketBenchmark(
      data.cropName,
      data.district,
      data.state,
      data.targetMarket,
      data.variety
    );

    // Strict cache key: requires identical crop, variety, quantity, grade, location, market, and benchmark timestamp
    const recentCached = await PriceRecommendation.findOne({
      farmerId,
      productName: data.cropName,
      variety: data.variety || "",
      quantity: data.quantity,
      qualityGrade: data.qualityGrade,
      "location.district": data.district,
      market: marketBench.marketName,
      marketDataTimestamp: marketBench.date,
      createdAt: { $gte: new Date(Date.now() - RECENT_ANALYSIS_CACHE_MS) },
    }).sort({ createdAt: -1 });

    if (recentCached && !data.forceRefresh) {
      return NextResponse.json({
        success: true,
        cached: true,
        recommendation: recentCached,
        calculationSteps: recentCached.calculationSteps || [],
        marketBenchmark: marketBench,
      });
    }

    // 2. Run deterministic price calculations
    const det = await calculateDeterministicPrice({
      cropName: data.cropName,
      variety: data.variety,
      quantity: data.quantity,
      qualityGrade: data.qualityGrade,
      district: data.district,
      state: data.state,
      targetMarket: data.targetMarket,
      transitDistanceKm: data.transitDistanceKm,
      harvestDate: data.harvestDate,
      farmerAskingPrice: data.farmerAskingPrice,
      productId: data.productId,
    });

    // 3. Enrich with Gemini structured analysis (Gemini never invents numbers)
    let advice: {
      summary: string;
      suggestion: string;
      risks: string[];
      isAiGenerated: boolean;
      modelUsed: string;
    };

    try {
      advice = await generateStructuredPriceAdvice({
        productName: det.productName,
        variety: det.variety,
        quantity: det.quantity,
        qualityGrade: det.qualityGrade,
        location: det.location,
        marketMin: det.marketBenchmark.minPrice,
        marketModal: det.marketBenchmark.modalPrice,
        marketMax: det.marketBenchmark.maxPrice,
        marketplaceAverage: det.marketplaceAverage,
        recommendedMin: det.recommendedMinPrice,
        recommendedMax: det.recommendedMaxPrice,
        targetPrice: det.targetPrice,
        demandLevel: det.demandLevel,
        supplyLevel: det.supplyLevel,
        buyerInquiriesCount: det.buyerInquiriesCount,
        logisticsCost: det.logisticsCostPerKg,
        harvestDate: data.harvestDate,
      });
    } catch (geminiErr) {
      console.warn("Gemini price advice failed, falling back to deterministic explanation:", geminiErr);
      advice = {
        summary: "AI explanation temporarily unavailable.",
        suggestion: `List your produce lot at ₹${det.targetPrice}/kg to balance rapid checkout with direct net farm margin.`,
        risks: [
          "Local APMC mandi arrival volumes may fluctuate over the next 48 hours.",
          "Ensure lot moisture is monitored prior to long-distance dispatch.",
        ],
        isAiGenerated: false,
        modelUsed: "deterministic-fallback",
      };
    }

    // 4. Persist recommendation to MongoDB with all prompt-mandated fields
    const currentPrice = data.farmerAskingPrice || det.targetPrice;
    const newDoc = await PriceRecommendation.create({
      product: productDoc ? productDoc._id : undefined,
      farmerId,
      productName: det.productName,
      variety: det.variety || "",
      quantity: det.quantity,
      qualityGrade: det.qualityGrade,
      location: det.location,
      market: det.marketBenchmark.marketName,
      marketDataTimestamp: det.marketBenchmark.date,
      harvestDate: data.harvestDate ? new Date(data.harvestDate) : undefined,
      currentFarmerPrice: currentPrice,
      apmcModalBenchmarkPrice: det.marketBenchmark.modalPrice,
      marketMin: det.marketBenchmark.minPrice,
      marketModal: det.marketBenchmark.modalPrice,
      marketMax: det.marketBenchmark.maxPrice,
      marketplaceAverage: det.marketplaceAverage,
      demandLevel: det.demandLevel,
      demandScore: det.demandScore,
      supplyLevel: det.supplyLevel,
      supplyScore: det.supplyScore,
      logisticsCost: det.logisticsCostPerKg,
      dataConfidence: det.dataConfidenceLabel,
      recommendedMinPrice: det.recommendedMinPrice,
      recommendedMaxPrice: det.recommendedMaxPrice,
      targetPrice: det.targetPrice,
      netRealization: det.netRealization,
      traditionalComparison: det.traditionalComparison,
      calculationSteps: det.calculationSteps,
      factors: det.factors,
      explanation: advice.summary,
      geminiExplanation: advice.summary,
      aiSummary: advice.summary,
      aiSuggestion: advice.suggestion,
      risks: advice.risks,
      confidenceScore: det.confidenceScore,
      isAiGenerated: advice.isAiGenerated,
      aiModel: advice.modelUsed,
      source: det.marketBenchmark.source,
      generatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      cached: false,
      recommendation: newDoc,
      calculationSteps: det.calculationSteps,
      historyTrend: det.historyTrend,
      insufficientHistory: det.insufficientHistory,
      marketBenchmark: det.marketBenchmark,
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/farmer/price-recommendation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to analyze price recommendation. Check database connection.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/farmer/price-recommendation
 * Retrieve historical price recommendation analyses for the authenticated farmer
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.FPO)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const farmerId = new mongoose.Types.ObjectId(user.id);
    let recs = await PriceRecommendation.find({ farmerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (recs.length === 0) {
      recs = await PriceRecommendation.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
    }

    return NextResponse.json({
      success: true,
      recommendations: recs,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/farmer/price-recommendation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load recent recommendations.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
