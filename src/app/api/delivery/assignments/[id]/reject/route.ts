import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { Order } from "@/models/Order";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { AuditLog } from "@/models/AuditLog";
import { autoAssignDeliveryPartner } from "@/lib/delivery-assignment-service";

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
    const body = await req.json().catch(() => ({}));
    const reason = (body?.reason || "").trim();

    if (!reason) {
      return NextResponse.json(
        { success: false, message: "A reason is mandatory when rejecting an assignment." },
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

    if (user.role !== USER_ROLES.ADMIN && delivery.assignedPartner?.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "This delivery assignment does not belong to you" },
        { status: 403 }
      );
    }

    // 1. Release rejecting partner back to AVAILABLE
    await DeliveryPartnerProfile.findOneAndUpdate(
      { user: delivery.assignedPartner },
      {
        $set: { isAvailableForAssignment: true },
        $inc: { "statistics.cancelledDeliveries": 1 },
      }
    );

    // 2. Mark assignment rejected
    delivery.status = "REJECTED";
    delivery.assignmentStatus = "REJECTED";
    delivery.rejectedAt = new Date();
    delivery.rejectionReason = reason;

    if (!Array.isArray(delivery.assignmentHistory)) {
      delivery.assignmentHistory = [];
    }
    const lastEntry = delivery.assignmentHistory[delivery.assignmentHistory.length - 1];
    if (lastEntry) {
      lastEntry.status = "REJECTED";
      lastEntry.rejectedAt = new Date();
      lastEntry.rejectionReason = reason;
    }

    if (!Array.isArray(delivery.statusHistory)) {
      delivery.statusHistory = [];
    }
    delivery.statusHistory.push({
      status: "REJECTED",
      changedBy: delivery.assignedPartner,
      changedByRole: "DELIVERY_PARTNER",
      timestamp: new Date(),
      note: `Assignment rejected: ${reason}`,
    });

    await delivery.save();

    // 3. Reset order back to READY_FOR_PICKUP
    await Order.findByIdAndUpdate(delivery.order, {
      orderStatus: "READY_FOR_PICKUP",
      $push: {
        statusHistory: {
          status: "READY_FOR_PICKUP",
          timestamp: new Date(),
          note: `Partner rejected assignment (${reason}). Order returned to unassigned pool.`,
        },
      },
    });

    // 4. Audit Log
    await AuditLog.create({
      actor: user.id,
      actorRole: "DELIVERY_PARTNER",
      action: "DELIVERY_ASSIGNMENT_REJECTED",
      entity: "Delivery",
      entityId: delivery._id,
      metadata: {
        orderId: delivery.order,
        reason,
      },
    });

    // 5. Automatic Reassignment Trigger: Attempt to assign next best partner
    let reassignmentInfo = "No next candidate automatically assigned.";
    try {
      const autoResult = await autoAssignDeliveryPartner(delivery.order.toString());
      if (autoResult.autoAssigned) {
        reassignmentInfo = `Next candidate automatically assigned: ${autoResult.message}`;
      }
    } catch (reassignErr) {
      console.warn("Could not auto-reassign after rejection:", reassignErr);
    }

    return NextResponse.json({
      success: true,
      message: `Assignment rejected. ${reassignmentInfo}`,
      delivery,
    });
  } catch (error: unknown) {
    console.error("POST /api/delivery/assignments/[id]/reject error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
