import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { Delivery } from "@/models/Delivery";
import DeliveryDashboardClient from "@/components/delivery/delivery-dashboard-client";

export const metadata: Metadata = {
  title: "Delivery Partner Terminal | KISANOVA Logistics",
  description: "Live Farm Gate Pickup, Produce Transit & Delivery Fulfillment Terminal",
};

export const dynamic = "force-dynamic";

export default async function DeliveryDashboardPage() {
  const user = await requireRole([USER_ROLES.DELIVERY_PARTNER, USER_ROLES.ADMIN]);
  await connectToDatabase();

  const profile = await DeliveryPartnerProfile.findOne({ user: user.id }).lean();

  // Find active delivery
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

  // Find new offers
  const pendingAssignments = await Delivery.find({
    assignedPartner: user.id,
    status: "ASSIGNED",
    assignmentStatus: "ASSIGNED",
  })
    .populate("order", "orderNumber total orderStatus items deliveryAddress buyerType")
    .sort({ createdAt: -1 })
    .lean();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const completedTodayCount = await Delivery.countDocuments({
    assignedPartner: user.id,
    status: "DELIVERED",
    actualDeliveryTime: { $gte: startOfToday },
  });

  const totalCompleted = profile?.statistics?.completedDeliveries || 0;
  const estimatedTodayEarnings = completedTodayCount * 85;

  const initialPayload = {
    user: {
      id: user.id,
      name: user.name || "Delivery Partner",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role,
    },
    profile: profile ? JSON.parse(JSON.stringify(profile)) : null,
    activeDelivery: activeDelivery ? JSON.parse(JSON.stringify(activeDelivery)) : null,
    pendingAssignments: JSON.parse(JSON.stringify(pendingAssignments)),
    stats: {
      todayDeliveries: completedTodayCount,
      activeTrips: activeDelivery ? 1 : 0,
      completedDeliveries: totalCompleted,
      rating: profile?.statistics?.rating || 4.8,
      averageDeliveryTimeMinutes: profile?.statistics?.averageDeliveryTimeMinutes || 35,
      estimatedEarningsToday: estimatedTodayEarnings,
    },
  };

  return <DeliveryDashboardClient initialData={initialPayload} />;
}
