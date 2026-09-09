import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transitionOrderStatus, OrderEngineError } from "@/lib/order-engine";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const reason = (body as { reason?: string })?.reason || "Cancelled by user";

    const result = await transitionOrderStatus(id, "CANCELLED", {
      userId: user.id,
      role: user.role,
      reason,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof OrderEngineError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel order. Please try again." },
      { status: 500 }
    );
  }
}

