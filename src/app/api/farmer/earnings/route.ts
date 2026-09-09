import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getFarmerEarnings } from "@/lib/farmer-service";

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

    const earnings = await getFarmerEarnings(user.id);
    return NextResponse.json({ success: true, earnings });
  } catch (error) {
    console.error("Error fetching farmer earnings:", error);
    return NextResponse.json(
      { message: "Failed to fetch earnings analysis" },
      { status: 500 }
    );
  }
}
