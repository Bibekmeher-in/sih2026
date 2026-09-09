import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getFarmerOverview } from "@/lib/farmer-service";

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

    const stats = await getFarmerOverview(user.id);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching farmer stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch farmer statistics" },
      { status: 500 }
    );
  }
}
