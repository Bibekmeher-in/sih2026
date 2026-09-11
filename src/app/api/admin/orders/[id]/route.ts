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

    let updatedOrder = null;

    if (orderStatus) {
      const { transitionOrderStatus } = await import("@/lib/order-engine");
      const transitionResult = await transitionOrderStatus(id, orderStatus, {
        userId: admin.id,
        role: "ADMIN",
        reason: notes || "Updated by platform administrator",
      });
      updatedOrder = transitionResult.order;
    } else {
      updatedOrder = await Order.findById(id);
    }

    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (paymentStatus || notes !== undefined) {
      if (paymentStatus) updatedOrder.paymentStatus = paymentStatus;
      if (notes !== undefined) updatedOrder.notes = notes;
      await updatedOrder.save();
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
