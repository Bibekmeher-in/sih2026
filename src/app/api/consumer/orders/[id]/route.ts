import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getConsumerOrderById, cancelConsumerOrder } from "@/lib/consumer-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.CONSUMER) {
      return NextResponse.json(
        { message: "Unauthorized: Consumer credentials required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const order = await getConsumerOrderById(user.id, id);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    console.error("Error retrieving order:", error);
    return NextResponse.json(
      { message: "Failed to load order details. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.CONSUMER) {
      return NextResponse.json(
        { message: "Unauthorized: Consumer credentials required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const result = await cancelConsumerOrder(user.id, id, body.reason);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { message: "Failed to cancel order. Please try again." },
      { status: 400 }
    );
  }
}

