import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { createOrder, OrderEngineError } from "@/lib/order-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders
 * List orders relevant to the current authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};

    // Filter according to role
    if (user.role === "CONSUMER" || user.role === "BULK_BUYER") {
      query.buyer = user.id;
    } else if (user.role === "FARMER" || user.role === "FPO") {
      query.seller = user.id;
    }
    // ADMIN can see all orders

    if (status && status !== "ALL") {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate("buyer", "name email phone")
      .populate("seller", "name email phone")
      .populate("items.product", "name images category")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: unknown) {
    console.error("Error listing orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Create order using strict 12-step engine
 * Client price, total, seller ID, and inventory are ignored and verified server-side
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please log in to place an order" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      items,
      deliveryAddress,
      buyerType,
      paymentMethod,
      notes,
      autoConfirm,
    } = body;

    // Guard: items must be a non-empty array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty. At least one item is required." },
        { status: 400 }
      );
    }

    // Guard: cap cart size to 20 items to prevent abuse
    if (items.length > 20) {
      return NextResponse.json(
        {
          success: false,
          message: `Cart cannot exceed 20 items per order. You submitted ${items.length} items.`,
        },
        { status: 400 }
      );
    }

    const result = await createOrder({
      userId: user.id,
      items,
      deliveryAddress,
      buyerType: buyerType || (user.role === "BULK_BUYER" ? "BULK_BUYER" : "CONSUMER"),
      paymentMethod,
      notes,
      autoConfirm: autoConfirm !== undefined ? Boolean(autoConfirm) : true,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof OrderEngineError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Unexpected error in POST /api/orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
