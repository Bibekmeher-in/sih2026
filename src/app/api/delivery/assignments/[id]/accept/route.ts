import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { AuditLog } from "@/models/AuditLog";
import { sendOrderNotification } from "@/lib/order-engine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.DELIVERY_PARTNER && user.role !== USER_ROLES.ADMIN)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Delivery Partner access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return NextResponse.json(
        { success: false, message: "Delivery dispatch not found" },
        { status: 404 }
      );
    }

    // Ownership check (unless ADMIN override or unassigned pool claim)
    if (
      user.role !== USER_ROLES.ADMIN &&
      delivery.assignedPartner &&
      delivery.assignedPartner.toString() !== user.id
    ) {
      return NextResponse.json(
        { success: false, message: "This delivery assignment belongs to another partner" },
        { status: 403 }
      );
    }

    const isClaiming = !delivery.assignedPartner;
    const { DeliveryPartnerProfile } = await import("@/models/DeliveryPartnerProfile");
    const { Order } = await import("@/models/Order");
    const mongoose = (await import("mongoose")).default;

    let profile = null;
    if (isClaiming) {
      profile = await DeliveryPartnerProfile.findOne({ user: user.id });
      if (!profile || profile.verificationStatus !== "VERIFIED") {
        return NextResponse.json(
          { success: false, message: "Only verified delivery partners can claim dispatches" },
          { status: 400 }
        );
      }
      delivery.assignedPartner = new mongoose.Types.ObjectId(user.id);
      delivery.driverName = (profile.fullName || user.name || "Delivery Partner") as string;
      delivery.driverPhone = (profile.phone || user.phone || "") as string;
      delivery.assignedAt = new Date();
      profile.isAvailableForAssignment = false;
      profile.statistics.totalAssignedDeliveries = (profile.statistics.totalAssignedDeliveries || 0) + 1;
      await profile.save();

      await Order.findByIdAndUpdate(delivery.order, {
        orderStatus: "ASSIGNED_FOR_DELIVERY",
        deliveryId: delivery._id,
        $push: {
          statusHistory: {
            status: "ASSIGNED_FOR_DELIVERY",
            timestamp: new Date(),
            note: `Delivery claimed by ${profile.fullName || user.name}`,
          },
        },
      });
    }

    if (
      delivery.assignmentStatus !== "ASSIGNED" &&
      delivery.status !== "ASSIGNED" &&
      !isClaiming
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot accept assignment in current state: ${delivery.status}`,
        },
        { status: 400 }
      );
    }

    delivery.status = "ACCEPTED";
    delivery.assignmentStatus = "ACCEPTED";
    delivery.acceptedAt = new Date();

    if (!Array.isArray(delivery.assignmentHistory)) {
      delivery.assignmentHistory = [];
    }
    const lastEntry = delivery.assignmentHistory[delivery.assignmentHistory.length - 1];
    if (lastEntry) {
      lastEntry.status = "ACCEPTED";
    }

    if (!Array.isArray(delivery.statusHistory)) {
      delivery.statusHistory = [];
    }
    delivery.statusHistory.push({
      status: "ACCEPTED",
      changedBy: delivery.assignedPartner,
      changedByRole: "DELIVERY_PARTNER",
      timestamp: new Date(),
      note: "Assignment accepted by delivery partner",
    });

    await delivery.save();

    await AuditLog.create({
      actor: user.id,
      actorRole: "DELIVERY_PARTNER",
      action: "DELIVERY_ASSIGNMENT_ACCEPTED",
      entity: "Delivery",
      entityId: delivery._id,
      metadata: {
        orderId: delivery.order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Assignment accepted. Proceed to pickup location.",
      delivery,
    });
  } catch (error: unknown) {
    console.error("POST /api/delivery/assignments/[id]/accept error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
