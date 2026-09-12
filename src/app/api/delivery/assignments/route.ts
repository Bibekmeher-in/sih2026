import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.DELIVERY_PARTNER && user.role !== USER_ROLES.ADMIN)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Delivery Partner access required" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "ALL";

    let query: Record<string, unknown> = {
      assignedPartner: user.id,
    };

    if (filter === "AVAILABLE") {
      query = {
        $or: [
          { assignedPartner: { $exists: false } },
          { assignedPartner: null },
        ],
        status: { $in: ["PENDING", "ASSIGNED"] },
      };
    } else if (filter === "NEW") {
      query.status = "ASSIGNED";
      query.assignmentStatus = "ASSIGNED";
    } else if (filter === "ACTIVE") {
      query.status = {
        $in: [
          "ACCEPTED",
          "ARRIVED_AT_PICKUP",
          "PICKED_UP",
          "IN_TRANSIT",
          "ARRIVED_AT_DESTINATION",
          "OUT_FOR_DELIVERY",
        ],
      };
    } else if (filter === "COMPLETED") {
      query.status = "DELIVERED";
    }

    const deliveries = await Delivery.find(query)
      .populate("order", "orderNumber total orderStatus items deliveryAddress deliveryOtp buyerType")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error: unknown) {
    console.error("GET /api/delivery/assignments error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
