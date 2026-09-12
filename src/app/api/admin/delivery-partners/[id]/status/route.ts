import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { User } from "@/models/User";
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

    if (action !== "SUSPEND" && action !== "REACTIVATE") {
      return NextResponse.json(
        { success: false, message: "Action must be either SUSPEND or REACTIVATE" },
        { status: 400 }
      );
    }

    if (action === "SUSPEND" && (!reason || !reason.trim())) {
      return NextResponse.json(
        { success: false, message: "Suspension reason is required" },
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

    if (action === "SUSPEND") {
      profile.verificationStatus = "SUSPENDED";
      profile.suspensionReason = reason.trim();
      profile.isOnline = false;
      profile.isAvailableForAssignment = false;

      // Also set user account status to SUSPENDED
      await User.findByIdAndUpdate(profile.user, { status: "SUSPENDED" });
    } else {
      profile.verificationStatus = "VERIFIED";
      profile.suspensionReason = "";
      profile.isAvailableForAssignment = true;

      await User.findByIdAndUpdate(profile.user, { status: "ACTIVE" });
    }

    await profile.save();

    await AuditLog.create({
      actor: user.id,
      actorRole: "ADMIN",
      action: action === "SUSPEND" ? "DELIVERY_PARTNER_SUSPENDED" : "DELIVERY_PARTNER_REACTIVATED",
      entity: "DeliveryPartnerProfile",
      entityId: profile._id,
      metadata: {
        reason: reason || "",
      },
    });

    // Notify Partner
    await sendOrderNotification({
      recipientId: profile.user,
      type: "SYSTEM",
      title: action === "SUSPEND" ? "Account Suspended" : "Account Reactivated",
      message:
        action === "SUSPEND"
          ? `Your delivery partner account has been suspended by Admin. Reason: ${reason}`
          : "Your delivery partner account has been reactivated. You can now go online.",
      link: "/delivery/dashboard",
    });

    return NextResponse.json({
      success: true,
      message: `Delivery partner account ${action === "SUSPEND" ? "SUSPENDED" : "REACTIVATED"}`,
      profile,
    });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/delivery-partners/[id]/status error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
