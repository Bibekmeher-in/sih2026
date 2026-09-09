import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getFarmerDeliveries } from "@/lib/farmer-service";

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

    const deliveries = await getFarmerDeliveries(user.id);
    return NextResponse.json({ success: true, deliveries });
  } catch (error) {
    console.error("Error fetching farmer deliveries:", error);
    return NextResponse.json(
      { message: "Failed to fetch delivery logistics" },
      { status: 500 }
    );
  }
}
