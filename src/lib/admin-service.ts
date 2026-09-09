import { connectToDatabase } from "@/lib/db";
import "@/models";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Delivery } from "@/models/Delivery";
import { Vehicle } from "@/models/Vehicle";
import { USER_ROLES } from "@/types";

export async function getAdminDashboardData() {
  await connectToDatabase();

  const [
    totalUsers,
    activeFarmers,
    activeFpos,
    activeBuyers,
    totalProducts,
    activeProducts,
    totalOrders,
    revenueResult,
    activeDeliveries,
    completedDeliveries,
    fleetVehiclesCount,
    availableVehiclesCount,
    recentOrders,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: USER_ROLES.FARMER, status: "ACTIVE" }),
    User.countDocuments({ role: USER_ROLES.FPO, status: "ACTIVE" }),
    User.countDocuments({ role: { $in: [USER_ROLES.CONSUMER, USER_ROLES.BULK_BUYER] }, status: "ACTIVE" }),
    Product.countDocuments(),
    Product.countDocuments({ status: "AVAILABLE" }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "CANCELLED" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
    ]),
    Delivery.countDocuments({ status: { $in: ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_TRANSIT"] } }),
    Delivery.countDocuments({ status: "DELIVERED" }),
    Vehicle.countDocuments(),
    Vehicle.countDocuments({ currentStatus: "AVAILABLE" }),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("buyer", "name email role")
      .populate("seller", "name email role")
      .lean(),
    User.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("-passwordHash")
      .lean(),
  ]);

  const grossRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  return {
    kpis: {
      totalUsers,
      activeFarmers,
      activeFpos,
      activeBuyers,
      totalProducts,
      activeProducts,
      totalOrders,
      grossRevenue,
      activeDeliveries,
      completedDeliveries,
      fleetVehiclesCount,
      availableVehiclesCount,
    },
    recentOrders: JSON.parse(JSON.stringify(recentOrders)),
    recentUsers: JSON.parse(JSON.stringify(recentUsers)),
  };
}
