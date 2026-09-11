import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getFarmerAiHubData } from "@/lib/ai-forecast-pricing";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.FPO && user.role !== USER_ROLES.ADMIN)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Farmer or FPO credentials required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const data = await getFarmerAiHubData(user.id, forceRefresh);

    return NextResponse.json({
      success: true,
      insights: data.insights,
      recommendations: data.recommendations,
      forecasts: data.forecasts,
    });
  } catch (error: unknown) {
    console.error("Error generating farmer AI insights:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate AI insights. Please try again.",
      },
      { status: 500 }
    );
  }
}

