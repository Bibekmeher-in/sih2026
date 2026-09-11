import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { confirmOrderPayment, failOrderPayment, OrderEngineError } from "@/lib/order-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/verify
 * Cryptographically verifies Razorpay payment signature using timingSafeEqual
 * Idempotently transitions order from PENDING_PAYMENT -> CONFIRMED
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

    const body = await req.json();
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      method,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required payment verification parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature)",
        },
        { status: 400 }
      );
    }

    // Verify order existence and buyer ownership
    const query = orderId ? { _id: orderId } : { razorpayOrderId: razorpay_order_id };
    const orderDoc = await Order.findOne(query);
    if (!orderDoc) {
      return NextResponse.json(
        { success: false, message: "Order record not found" },
        { status: 404 }
      );
    }

    if (user && orderDoc.buyer.toString() !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: You do not have permission to verify this order" },
        { status: 403 }
      );
    }

    if (orderDoc.razorpayOrderId && orderDoc.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { success: false, message: "Razorpay order ID mismatch with internal order record" },
        { status: 400 }
      );
    }

    // Webhook-before-verify check: If already captured and confirmed, return success immediately
    if (
      (orderDoc.orderStatus === "CONFIRMED" || orderDoc.orderStatus === "PROCESSING") &&
      (orderDoc.paymentStatus === "CAPTURED" || orderDoc.paymentStatus === "PAID") &&
      orderDoc.inventoryConsumed === true
    ) {
      return NextResponse.json({
        success: true,
        message: "Payment already confirmed via webhook reconciliation",
        orderId: orderDoc._id.toString(),
        orderNumber: orderDoc.orderNumber,
        orderStatus: orderDoc.orderStatus,
        paymentStatus: orderDoc.paymentStatus,
        alreadyConfirmed: true,
      });
    }

    // 1. Cryptographic HMAC SHA256 verification
    const isValidSignature = verifyPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!isValidSignature) {
      // Record failure and release inventory safely
      await failOrderPayment({
        orderId,
        razorpayOrderId: razorpay_order_id,
        reason: "Cryptographic signature verification failed",
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment signature. Payment could not be verified.",
          code: "INVALID_SIGNATURE",
        },
        { status: 400 }
      );
    }

    // 2. Authoritative confirmation and inventory consumption
    const confirmationResult = await confirmOrderPayment({
      orderId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      method,
    });

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and order confirmed",
      orderId: confirmationResult.order._id.toString(),
      orderNumber: confirmationResult.order.orderNumber,
      orderStatus: confirmationResult.order.orderStatus,
      paymentStatus: confirmationResult.order.paymentStatus,
      alreadyConfirmed: (confirmationResult as any).alreadyConfirmed || false,
    });
  } catch (error: unknown) {
    if (error instanceof OrderEngineError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Error in POST /api/payments/verify:", error);
    const msg = error instanceof Error ? error.message : "Internal payment verification failure";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
