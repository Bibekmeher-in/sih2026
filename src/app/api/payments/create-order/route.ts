import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { createOrder, OrderEngineError } from "@/lib/order-engine";
import { createRazorpayOrder, RazorpayConfigError } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/create-order
 * 1. Authenticates buyer
 * 2. Recalculates amount & reserves stock with 15m expiry in OrderEngine
 * 3. Creates Razorpay order server-side
 * 4. Links razorpayOrderId and returns checkout payload
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
        { success: false, message: "Unauthorized: Please log in to proceed to payment" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, deliveryAddress, buyerType, paymentMethod = "UPI", notes, existingOrderId } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty. At least one item is required." },
        { status: 400 }
      );
    }

    // 1. Create or reuse order in PENDING_PAYMENT state with 15-minute temporary inventory reservation
    const orderResult = await createOrder({
      userId: user.id,
      items,
      deliveryAddress,
      buyerType: buyerType || (user.role === "BULK_BUYER" ? "BULK_BUYER" : "CONSUMER"),
      paymentMethod,
      isOnlinePayment: true,
      autoConfirm: false,
      existingOrderId,
      notes,
    });

    const orderId = orderResult.order._id;
    const orderTotal = orderResult.order.total;
    const orderNumber = orderResult.order.orderNumber;

    // 2. Create Razorpay order
    let rzpOrder;
    try {
      rzpOrder = await createRazorpayOrder({
        amountPaise: Math.round(orderTotal * 100),
        currency: "INR",
        receipt: orderNumber,
        notes: {
          orderId,
          orderNumber,
          buyerId: user.id,
        },
      });
    } catch (rzpErr) {
      if (rzpErr instanceof RazorpayConfigError) {
        return NextResponse.json(
          {
            success: false,
            message: "Online payment is currently unavailable. Please try again or select Cash on Delivery.",
            code: "RAZORPAY_CONFIG_ERROR",
          },
          { status: 503 }
        );
      }
      throw rzpErr;
    }

    // 3. Update order with Razorpay Order ID
    await Order.findByIdAndUpdate(orderId, {
      $set: { razorpayOrderId: rzpOrder.id },
    });

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount, // in paise
      currency: rzpOrder.currency,
      keyId,
      customer: {
        name: deliveryAddress?.recipientName || user.name || "Customer",
        email: user.email || "customer@kisandirect.in",
        contact: deliveryAddress?.recipientPhone || user.phone || "9999999999",
      },
    });
  } catch (error: unknown) {
    if (error instanceof OrderEngineError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Error in POST /api/payments/create-order:", error);
    const msg = error instanceof Error ? error.message : "Failed to initiate payment";
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
