import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getLogisticsOverview } from "@/lib/logistics-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    const stats = await getLogisticsOverview();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching logistics stats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch logistics statistics" },
      { status: 500 }
    );
  }
}
