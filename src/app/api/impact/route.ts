import { NextResponse } from "next/server";
import { getAgriculturalImpactData } from "@/lib/impact-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await getAgriculturalImpactData();
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: unknown) {
    console.error("Impact API error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
