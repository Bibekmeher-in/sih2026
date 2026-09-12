import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Delivery, DeliveryStatusType } from "@/models/Delivery";
import { Order } from "@/models/Order";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { AuditLog } from "@/models/AuditLog";
import { transitionOrderStatus } from "@/lib/order-engine";
import { deliveryStatusTransitionSchema } from "@/schemas";

export const dynamic = "force-dynamic";

const VALID_DELIVERY_TRANSITIONS: Record<string, string[]> = {
  ASSIGNED: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["ARRIVED_AT_PICKUP", "CANCELLED"],
  ARRIVED_AT_PICKUP: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED", "CANCELLED"],
  IN_TRANSIT: ["ARRIVED_AT_DESTINATION", "OUT_FOR_DELIVERY", "FAILED"],
  OUT_FOR_DELIVERY: ["ARRIVED_AT_DESTINATION", "DELIVERED", "FAILED"],
  ARRIVED_AT_DESTINATION: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: [],
  REJECTED: [],
  CANCELLED: [],
};

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
    const body = await req.json();

    const validation = deliveryStatusTransitionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status transition payload",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status: newStatus, otpCode, note, latitude, longitude } = validation.data;
    await connectToDatabase();

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return NextResponse.json(
        { success: false, message: "Delivery dispatch not found" },
        { status: 404 }
      );
    }

    // Ownership check
    if (user.role !== USER_ROLES.ADMIN && delivery.assignedPartner?.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: "This delivery does not belong to you" },
        { status: 403 }
      );
    }

    const currentStatus = delivery.status;

    // Check valid transition
    const allowed = VALID_DELIVERY_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid delivery status transition from '${currentStatus}' to '${newStatus}'. Allowed: [${allowed.join(", ")}]`,
        },
        { status: 400 }
      );
    }

    // SPECIAL HANDLING: DELIVERED requires OTP verification against Order
    if (newStatus === "DELIVERED") {
      if (!otpCode || !otpCode.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Proof of Delivery Error: Customer delivery OTP is required to mark order DELIVERED.",
          },
          { status: 400 }
        );
      }

      // Transition Order state using the strict order engine
      try {
        await transitionOrderStatus(delivery.order.toString(), "DELIVERED", {
          userId: user.id,
          role: user.role,
          providedOtp: otpCode.trim(),
          reason: note || "Delivery confirmed with verified customer OTP",
        });
      } catch (fsmErr) {
        return NextResponse.json(
          {
            success: false,
            message: (fsmErr as Error).message || "Order engine transition failed",
          },
          { status: 400 }
        );
      }

      // Order engine has updated delivery and released escrow
      const finalDelivery = await Delivery.findById(delivery._id);
      return NextResponse.json({
        success: true,
        message: "Order successfully delivered! Escrow funds released to farmer.",
        delivery: finalDelivery,
      });
    }

    // INTERMEDIATE MILESTONES
    delivery.status = newStatus as DeliveryStatusType;

    if (latitude && longitude) {
      delivery.currentLocation = {
        latitude,
        longitude,
        updatedAt: new Date(),
        locationGeo: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      };
    }

    if (newStatus === "ARRIVED_AT_PICKUP") {
      delivery.arrivedPickupAt = new Date();
    } else if (newStatus === "PICKED_UP") {
      delivery.actualPickupTime = new Date();
      delivery.pickedUpAt = new Date();
      // Sync Order
      try {
        await transitionOrderStatus(delivery.order.toString(), "PICKED_UP", {
          userId: user.id,
          role: user.role,
          reason: note || "Produce handed over at farm gate",
        });
      } catch (e) {
        console.warn("Syncing order to PICKED_UP:", e);
      }
    } else if (newStatus === "IN_TRANSIT") {
      delivery.inTransitAt = new Date();
      // Sync Order
      try {
        await transitionOrderStatus(delivery.order.toString(), "IN_TRANSIT", {
          userId: user.id,
          role: user.role,
          reason: note || "Transit started towards customer",
        });
      } catch (e) {
        console.warn("Syncing order to IN_TRANSIT:", e);
      }
    } else if (newStatus === "ARRIVED_AT_DESTINATION" || newStatus === "OUT_FOR_DELIVERY") {
      delivery.arrivedDestinationAt = new Date();
      // Sync Order to OUT_FOR_DELIVERY
      try {
        await transitionOrderStatus(delivery.order.toString(), "OUT_FOR_DELIVERY", {
          userId: user.id,
          role: user.role,
          reason: note || "Arrived at destination, awaiting OTP confirmation",
        });
      } catch (e) {
        console.warn("Syncing order to OUT_FOR_DELIVERY:", e);
      }
    } else if (newStatus === "FAILED") {
      delivery.failedAt = new Date();
      delivery.failureReason = note || "Delivery failed";
      // Release driver
      await DeliveryPartnerProfile.findOneAndUpdate(
        { user: delivery.assignedPartner },
        {
          $set: { isAvailableForAssignment: true },
          $inc: { "statistics.failedDeliveries": 1 },
        }
      );
    }

    if (!Array.isArray(delivery.statusHistory)) {
      delivery.statusHistory = [];
    }
    delivery.statusHistory.push({
      status: newStatus as DeliveryStatusType,
      changedBy: delivery.assignedPartner,
      changedByRole: "DELIVERY_PARTNER",
      timestamp: new Date(),
      note: note || `Delivery transitioned to ${newStatus}`,
      location: latitude && longitude ? { latitude, longitude } : undefined,
    });

    await delivery.save();

    await AuditLog.create({
      actor: user.id,
      actorRole: "DELIVERY_PARTNER",
      action: `DELIVERY_STATUS_${newStatus}`,
      entity: "Delivery",
      entityId: delivery._id,
      metadata: {
        orderId: delivery.order,
        previousStatus: currentStatus,
        newStatus,
        note,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Delivery status updated to ${newStatus}`,
      delivery,
    });
  } catch (error: unknown) {
    console.error("POST /api/delivery/[id]/status error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
