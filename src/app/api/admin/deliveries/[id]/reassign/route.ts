import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { reassignDeliveryPartner } from "@/lib/delivery-assignment-service";

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
    const { newPartnerProfileId, reason } = body;

    if (!newPartnerProfileId || !reason) {
      return NextResponse.json(
        { success: false, message: "newPartnerProfileId and reason are required" },
        { status: 400 }
      );
    }

    const result = await reassignDeliveryPartner({
      deliveryId: id,
      newPartnerProfileId,
      reason,
      adminUserId: user.id,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("POST /api/admin/deliveries/[id]/reassign error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
