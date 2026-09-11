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
    const body = await req.json();

    if (!body.otp) {
      return NextResponse.json(
        { success: false, message: "Delivery verification OTP is required" },
        { status: 400 }
      );
    }

    const result = await transitionOrderStatus(id, "DELIVERED", {
      userId: user.id,
      role: user.role,
      reason: "Verified via customer delivery OTP",
      providedOtp: body.otp,
    });

    return NextResponse.json({
      success: true,
      message: "Delivery successfully confirmed and verified via OTP",
      order: result.order,
    });
  } catch (error: unknown) {
    if (error instanceof OrderEngineError) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Error verifying delivery OTP:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify delivery OTP" },
      { status: 500 }
    );
  }
}
