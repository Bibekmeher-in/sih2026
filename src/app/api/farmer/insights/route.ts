import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getFarmerInsights } from "@/lib/farmer-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.FARMER) {
      return NextResponse.json(
        { message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const insights = await getFarmerInsights(user.id);
    return NextResponse.json({ success: true, insights });
  } catch (error) {
    console.error("Error fetching farmer AI insights:", error);
    return NextResponse.json(
      { message: "Failed to fetch AI insights" },
      { status: 500 }
    );
  }
}
