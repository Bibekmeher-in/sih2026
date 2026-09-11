import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { acceptBuyerOpportunity } from "@/lib/fpo-community-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.aggregationId) {
      return NextResponse.json(
        { message: "aggregationId is required to fulfill this opportunity" },
        { status: 400 }
      );
    }

    const result = await acceptBuyerOpportunity(user.id, id, body.aggregationId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error accepting bulk opportunity:", error);
    const message = (error as Error)?.message || "Failed to accept opportunity";
    return NextResponse.json({ message }, { status: 400 });
  }
}
