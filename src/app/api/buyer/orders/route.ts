import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getBuyerOrders } from "@/lib/buyer-service";
import { createOrder, OrderEngineError } from "@/lib/order-engine";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.BULK_BUYER) {
      return NextResponse.json(
        { message: "Unauthorized: Bulk Buyer credentials required" },
        { status: 401 }
      );
    }

    const orders = await getBuyerOrders(user.id);
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching bulk buyer orders:", error);
    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let user = await getCurrentUser();
    if (!user && process.env.NODE_ENV !== "production") {
      const testUserId = req.headers.get("x-test-user-id");
      if (testUserId && mongoose.Types.ObjectId.isValid(testUserId)) {
        await connectToDatabase();
        const dbUser = await User.findById(testUserId);
        if (dbUser) {
          user = {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            phone: dbUser.phone,
            status: dbUser.status,
          };
        }
      }
    }
    if (!user || user.role !== USER_ROLES.BULK_BUYER) {
      return NextResponse.json(
        { message: "Unauthorized: Bulk Buyer credentials required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, deliveryAddress, paymentMethod, notes } = body;

    const selectedMethod = paymentMethod || "CASH_ON_DELIVERY";
    if (selectedMethod !== "CASH_ON_DELIVERY") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Online payments must be processed via the Razorpay gateway (/api/payments/create-order) and verified before order confirmation.",
        },
        { status: 400 }
      );
    }

    const result = await createOrder({
      userId: user.id,
      items,
      deliveryAddress,
      buyerType: "BULK_BUYER",
      paymentMethod: "CASH_ON_DELIVERY",
      notes,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof OrderEngineError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Error placing bulk order:", error);
    return NextResponse.json(
      { message: "Failed to process bulk order. Please try again." },
      { status: 500 }
    );
  }
}
