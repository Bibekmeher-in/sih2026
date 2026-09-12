import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { assignDeliveryPartner } from "@/lib/delivery-assignment-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { partnerProfileId, method, aiConfidence, aiReason, rankingScore } = body;

    if (!partnerProfileId) {
      return NextResponse.json(
        { success: false, message: "partnerProfileId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return NextResponse.json(
        { success: false, message: "Delivery dispatch not found" },
        { status: 404 }
      );
    }

    const result = await assignDeliveryPartner({
      orderId: delivery.order.toString(),
      partnerProfileId,
      assignedByUserId: user.id,
      method: method || "ADMIN_MANUAL",
      aiConfidence,
      aiReason,
      rankingScore,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("POST /api/admin/deliveries/[id]/assign error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
