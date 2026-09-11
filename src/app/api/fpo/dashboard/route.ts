import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFpoDashboardData } from "@/lib/fpo-community-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const summary = await getFpoDashboardData(user.id, user.role);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Error fetching FPO dashboard summary:", error);
    const message = (error as Error)?.message || "Failed to fetch dashboard summary";
    return NextResponse.json({ message }, { status: 500 });
  }
}
