import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transitionOrderStatus, OrderEngineError } from "@/lib/order-engine";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json(
        { success: false, message: "New status is required" },
        { status: 400 }
      );
    }

    const result = await transitionOrderStatus(id, body.status, {
      userId: user.id,
      role: user.role,
      reason: body.reason,
      providedOtp: body.providedOtp || body.otp,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number; code?: string; name?: string };
    if (err && (err.name === "OrderEngineError" || typeof err.statusCode === "number")) {
      return NextResponse.json(
        { success: false, message: err.message || "Order engine error", code: err.code || "ORDER_ENGINE_ERROR" },
        { status: err.statusCode || 400 }
      );
    }

    console.error("Error updating order status:", error);
    const msg = error instanceof Error ? error.message : "Failed to update order status. Please try again.";
    return NextResponse.json(
      { success: false, message: msg, error: String(error) },
      { status: 500 }
    );
  }
}

