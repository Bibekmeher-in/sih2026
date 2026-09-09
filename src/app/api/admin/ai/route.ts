import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { DemandForecast } from "@/models/DemandForecast";
import { PriceRecommendation } from "@/models/PriceRecommendation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const [
      totalForecasts,
      totalPriceRecommendations,
      trendDistribution,
      topForecastedProducts,
      recentForecasts,
      recentPriceRecs,
    ] = await Promise.all([
      DemandForecast.countDocuments(),
      PriceRecommendation.countDocuments(),
      DemandForecast.aggregate([
        { $group: { _id: "$trendDirection", count: { $sum: 1 }, totalProjectedKg: { $sum: "$predictedDemandKg" } } },
      ]),
      DemandForecast.aggregate([
        {
          $group: {
            _id: "$productName",
            forecastCount: { $sum: 1 },
            avgPredictedDemandKg: { $avg: "$predictedDemandKg" },
            avgConfidence: { $avg: "$confidenceScore" },
          },
        },
        { $sort: { forecastCount: -1, avgPredictedDemandKg: -1 } },
        { $limit: 6 },
      ]),
      DemandForecast.find().sort({ createdAt: -1 }).limit(5).lean(),
      PriceRecommendation.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // Format trend counts
    const trends = {
      RISING: 0,
      STABLE: 0,
      FALLING: 0,
    };
    trendDistribution.forEach((t) => {
      if (t._id in trends) {
        trends[t._id as keyof typeof trends] = t.count;
      }
    });

    const isApiKeyConfigured = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("dummy"));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalForecasts,
          totalPriceRecommendations,
          activeAiModel: isApiKeyConfigured ? "Google Gemini 2.5 Flash" : "KisanDirect Agritech Heuristic Fallback",
          promptGuardStatus: "ACTIVE (Max 8,000 Chars)",
          apiHealth: isApiKeyConfigured ? "OPERATIONAL" : "RUNNING_FALLBACK_MODE",
        },
        trendDistribution: trends,
        topForecastedProducts: topForecastedProducts.map((p) => ({
          name: p._id,
          count: p.forecastCount,
          avgDemandKg: Math.round(p.avgPredictedDemandKg || 0),
          avgConfidence: (p.avgConfidence || 0.85).toFixed(2),
        })),
        recentForecasts,
        recentPriceRecs,
      },
    });
  } catch (error: unknown) {
    console.error("Admin GET AI analytics error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
