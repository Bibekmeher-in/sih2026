import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getBuyerStats } from "@/lib/buyer-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.BULK_BUYER) {
      return NextResponse.json(
        { message: "Unauthorized: Bulk Buyer credentials required" },
        { status: 401 }
      );
    }

    const stats = await getBuyerStats(user.id);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching bulk buyer stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch buyer metrics" },
      { status: 500 }
    );
  }
}
