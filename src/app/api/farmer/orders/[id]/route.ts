import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { updateFarmerOrderStatus } from "@/lib/farmer-service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.FARMER) {
      return NextResponse.json(
        { message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 });
    }

    const updated = await updateFarmerOrderStatus(user.id, id, body.status);
    return NextResponse.json({ success: true, order: updated });
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400;
    return NextResponse.json(
      { success: false, message: "Failed to update order status. Please try again." },
      { status: statusCode }
    );
  }
}

