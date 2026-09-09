import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { Delivery } from "@/models/Delivery";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;

    const order = await Order.findById(id)
      .populate("buyer", "name email phone role")
      .populate("seller", "name email phone role")
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    let delivery = null;
    if (order.deliveryId) {
      delivery = await Delivery.findById(order.deliveryId).lean();
    } else {
      delivery = await Delivery.findOne({ order: order._id }).lean();
    }

    return NextResponse.json({
      success: true,
      data: {
        order,
        delivery,
      },
    });
  } catch (error: unknown) {
    console.error("Admin GET order detail error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { orderStatus, paymentStatus, notes } = body;

    const updateFields: Record<string, unknown> = {};

    if (orderStatus) {
      const allowedOrderStatuses = [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "READY_FOR_PICKUP",
        "ASSIGNED_FOR_DELIVERY",
        "IN_TRANSIT",
        "DELIVERED",
        "CANCELLED",
      ];
      if (!allowedOrderStatuses.includes(orderStatus)) {
        return NextResponse.json(
          { success: false, message: `Invalid status. Allowed: ${allowedOrderStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updateFields.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      const allowedPaymentStatuses = [
        "PENDING",
        "PAID",
        "ESCROW_HELD",
        "RELEASED_TO_SELLER",
        "REFUNDED",
      ];
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          { success: false, message: `Invalid payment status. Allowed: ${allowedPaymentStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updateFields.paymentStatus = paymentStatus;
    }

    if (notes !== undefined) {
      updateFields.notes = notes;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: "Order successfully updated by administrator",
    });
  } catch (error: unknown) {
    console.error("Admin PATCH order error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
