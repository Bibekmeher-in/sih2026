import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getDeliveries } from "@/lib/logistics-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const deliveries = await getDeliveries(status);
    return NextResponse.json({ success: true, count: deliveries.length, deliveries });
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch deliveries" },
      { status: 500 }
    );
  }
}
