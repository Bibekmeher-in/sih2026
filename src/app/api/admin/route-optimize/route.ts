import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { optimizeAndSaveRoute } from "@/lib/logistics-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.FARMER && user.role !== USER_ROLES.FPO)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin, Farmer, or FPO credentials required" },
        { status: 401 }
      );
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      // Body optional; defaults to demo scenario
    }

    const comparisonResult = await optimizeAndSaveRoute(body);

    return NextResponse.json({
      success: true,
      comparison: comparisonResult,
    });
  } catch (error: unknown) {
    console.error("Error optimizing route:", error);
    return NextResponse.json(
      { success: false, message: "Route optimization failed. Please try again." },
      { status: 500 }
    );
  }
}

