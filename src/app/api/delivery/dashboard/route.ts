import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { Delivery } from "@/models/Delivery";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.DELIVERY_PARTNER && user.role !== USER_ROLES.ADMIN)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Delivery Partner access required" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const profile = await DeliveryPartnerProfile.findOne({ user: user.id }).lean();

    // Find active trip in progress
    const activeDelivery = await Delivery.findOne({
      assignedPartner: user.id,
      status: {
        $in: [
          "ASSIGNED",
          "ACCEPTED",
          "ARRIVED_AT_PICKUP",
          "PICKED_UP",
          "IN_TRANSIT",
          "ARRIVED_AT_DESTINATION",
          "OUT_FOR_DELIVERY",
        ],
      },
    })
      .populate("order", "orderNumber total orderStatus items deliveryAddress deliveryOtp buyerType")
      .lean();

    // Find new assignments waiting for acceptance
    const pendingAssignments = await Delivery.find({
      assignedPartner: user.id,
      status: "ASSIGNED",
      assignmentStatus: "ASSIGNED",
    })
      .populate("order", "orderNumber total orderStatus items deliveryAddress buyerType")
      .sort({ createdAt: -1 })
      .lean();

    // Completed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const completedTodayCount = await Delivery.countDocuments({
      assignedPartner: user.id,
      status: "DELIVERED",
      actualDeliveryTime: { $gte: startOfToday },
    });

    const totalCompleted = profile?.statistics?.completedDeliveries || 0;
    // Estimated earnings: base ₹40 + ₹12/km
    const estimatedTodayEarnings = completedTodayCount * 85;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          role: user.role,
        },
        profile: profile || null,
        activeDelivery: activeDelivery || null,
        pendingAssignments: pendingAssignments || [],
        stats: {
          todayDeliveries: completedTodayCount,
          activeTrips: activeDelivery ? 1 : 0,
          completedDeliveries: totalCompleted,
          rating: profile?.statistics?.rating || 4.8,
          averageDeliveryTimeMinutes: profile?.statistics?.averageDeliveryTimeMinutes || 35,
          estimatedEarningsToday: estimatedTodayEarnings,
        },
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/delivery/dashboard error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
