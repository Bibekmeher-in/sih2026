import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { refundRazorpayPayment, RazorpayConfigError } from "@/lib/razorpay";
import {
  recordRefundRequest,
  confirmRefundCompleted,
  OrderEngineError,
} from "@/lib/order-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/refund
 * Initiates Razorpay refund for eligible captured orders
 * Staged flow: CAPTURED -> REFUND_REQUESTED -> (Razorpay webhook/confirmation) -> REFUNDED
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    let user = await getCurrentUser();
    if (!user && process.env.NODE_ENV !== "production") {
      const testUserId = req.headers.get("x-test-user-id");
      if (testUserId && mongoose.Types.ObjectId.isValid(testUserId)) {
        const dbUser = await User.findById(testUserId);
        if (dbUser) {
          user = {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            phone: dbUser.phone,
            role: dbUser.role,
            status: dbUser.status,
          };
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, reason = "Buyer requested refund/cancellation", amount } = body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, message: "Valid orderId is required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Permission check: buyer, seller, or ADMIN
    const isBuyer = order.buyer.toString() === user.id;
    const isSeller = order.seller?.toString() === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to request a refund for this order" },
        { status: 403 }
      );
    }

    // Check payment capture state
    if (order.paymentStatus !== "CAPTURED" && order.paymentStatus !== "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot refund order with payment status: ${order.paymentStatus}. Only CAPTURED payments can be refunded.`,
        },
        { status: 400 }
      );
    }

    if (!order.razorpayPaymentId) {
      return NextResponse.json(
        {
          success: false,
          message: "No Razorpay payment ID found associated with this order to refund.",
        },
        { status: 400 }
      );
    }

    const refundAmountNumber = typeof amount === "number" && amount > 0 ? amount : order.total;

    // 1. Issue refund request to Razorpay
    let rzpRefund;
    try {
      rzpRefund = await refundRazorpayPayment({
        paymentId: order.razorpayPaymentId,
        amountPaise: Math.round(refundAmountNumber * 100),
        notes: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          reason,
        },
      });
    } catch (rzpErr) {
      if (rzpErr instanceof RazorpayConfigError) {
        return NextResponse.json(
          { success: false, message: rzpErr.message, code: "RAZORPAY_CONFIG_ERROR" },
          { status: 500 }
        );
      }
      throw rzpErr;
    }

    // 2. Stage 1: Mark as REFUND_REQUESTED
    const updatedOrder = await recordRefundRequest({
      orderId: order._id.toString(),
      refundId: rzpRefund.id,
      refundAmount: refundAmountNumber,
      reason,
    });

    // 3. If Razorpay confirmed instant processing in the API response, finalize refund immediately
    if (rzpRefund.status === "processed") {
      await confirmRefundCompleted({
        refundId: rzpRefund.id,
        orderId: order._id.toString(),
        amount: refundAmountNumber,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Refund request initiated successfully",
      refundId: rzpRefund.id,
      refundStatus: rzpRefund.status || "requested",
      orderNumber: updatedOrder.orderNumber,
      refundAmount: refundAmountNumber,
    });
  } catch (error: unknown) {
    if (error instanceof OrderEngineError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Error in POST /api/payments/refund:", error);
    const msg = error instanceof Error ? error.message : "Failed to initiate refund";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
