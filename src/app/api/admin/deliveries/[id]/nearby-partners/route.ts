import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { recommendDeliveryPartners } from "@/lib/delivery-assignment-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return NextResponse.json(
        { success: false, message: "Delivery dispatch not found" },
        { status: 404 }
      );
    }

    const recommendations = await recommendDeliveryPartners(delivery.order.toString());

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error: unknown) {
    console.error("GET /api/admin/deliveries/[id]/nearby-partners error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
