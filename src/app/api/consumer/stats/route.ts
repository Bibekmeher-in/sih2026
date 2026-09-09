import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getConsumerStats } from "@/lib/consumer-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.CONSUMER) {
      return NextResponse.json(
        { message: "Unauthorized: Consumer credentials required" },
        { status: 401 }
      );
    }

    const stats = await getConsumerStats(user.id);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching consumer stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch consumer metrics" },
      { status: 500 }
    );
  }
}
