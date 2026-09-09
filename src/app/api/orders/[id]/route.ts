import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const order = await Order.findById(id)
      .populate("buyer", "name email phone")
      .populate("seller", "name email phone")
      .populate("items.product", "name images category qualityGrade")
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Permission check
    const isBuyer = order.buyer && (order.buyer as { _id: unknown })._id?.toString() === user.id;
    const isSeller = order.seller && (order.seller as { _id: unknown })._id?.toString() === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You do not have permission to view this order" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Error retrieving order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve order" },
      { status: 500 }
    );
  }
}
