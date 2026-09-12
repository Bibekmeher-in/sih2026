import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { Delivery } from "@/models/Delivery";

export const dynamic = "force-dynamic";

export async function GET(
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
    await connectToDatabase();

    const partner = await DeliveryPartnerProfile.findById(id)
      .populate("user", "name email phone status avatar createdAt")
      .lean();

    if (!partner) {
      return NextResponse.json(
        { success: false, message: "Delivery Partner not found" },
        { status: 404 }
      );
    }

    // Fetch active & recent deliveries
    const partnerUserId = (partner.user as unknown as { _id?: unknown })?._id || partner.user;
    const recentDeliveries = await Delivery.find({ assignedPartner: partnerUserId })
      .populate("order", "orderNumber total orderStatus items")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        partner,
        recentDeliveries,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/admin/delivery-partners/[id] error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
