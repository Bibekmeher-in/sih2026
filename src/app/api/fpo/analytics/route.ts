import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFpoAnalytics } from "@/lib/fpo-community-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const analytics = await getFpoAnalytics();
    return NextResponse.json({ success: true, analytics });
  } catch (error) {
    console.error("Error fetching FPO analytics:", error);
    const message = (error as Error)?.message || "Failed to fetch analytics";
    return NextResponse.json({ message }, { status: 500 });
  }
}
