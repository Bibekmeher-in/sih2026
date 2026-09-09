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
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof OrderEngineError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Error updating order status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order status. Please try again." },
      { status: 500 }
    );
  }
}

