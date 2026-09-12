import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { AuditLog } from "@/models/AuditLog";
import { sendOrderNotification } from "@/lib/order-engine";

export const dynamic = "force-dynamic";

export async function PATCH(
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
    const { action, reason } = body;

    if (action !== "VERIFY" && action !== "REJECT") {
      return NextResponse.json(
        { success: false, message: "Action must be either VERIFY or REJECT" },
        { status: 400 }
      );
    }

    if (action === "REJECT" && (!reason || !reason.trim())) {
      return NextResponse.json(
        { success: false, message: "Rejection reason is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const profile = await DeliveryPartnerProfile.findById(id);
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Delivery Partner profile not found" },
        { status: 404 }
      );
    }

    if (action === "VERIFY") {
      profile.verificationStatus = "VERIFIED";
      profile.verifiedAt = new Date();
      profile.verifiedBy = new mongoose.Types.ObjectId(user.id);
      profile.rejectionReason = "";
    } else {
      profile.verificationStatus = "REJECTED";
      profile.rejectionReason = reason.trim();
      profile.isOnline = false;
      profile.isAvailableForAssignment = false;
    }

    await profile.save();

    await AuditLog.create({
      actor: user.id,
      actorRole: "ADMIN",
      action: action === "VERIFY" ? "DELIVERY_PARTNER_VERIFIED" : "DELIVERY_PARTNER_REJECTED",
      entity: "DeliveryPartnerProfile",
      entityId: profile._id,
      metadata: {
        partnerName: profile.fullName,
        vehicleNumber: profile.vehicleNumber,
        reason: reason || "",
      },
    });

    // Notify Partner
    await sendOrderNotification({
      recipientId: profile.user,
      type: "SYSTEM",
      title: action === "VERIFY" ? "Account Verified!" : "Verification Application Rejected",
      message:
        action === "VERIFY"
          ? "Congratulations! Your Delivery Partner profile is now VERIFIED. You may go online to receive dispatches."
          : `Your Delivery Partner application was rejected: ${reason}`,
      link: "/delivery/dashboard",
    });

    return NextResponse.json({
      success: true,
      message: `Delivery partner successfully ${action === "VERIFY" ? "VERIFIED" : "REJECTED"}`,
      profile,
    });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/delivery-partners/[id]/verify error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
