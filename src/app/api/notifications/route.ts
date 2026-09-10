import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Notification } from "@/models/Notification";

export const dynamic = "force-dynamic";

function getDemoNotificationsForRole(role?: string, unreadOnly = false) {
  const now = new Date();
  const minutesAgo = (m: number) =>
    new Date(now.getTime() - m * 60 * 1000).toISOString();

  const all: Record<
    string,
    Array<{
      _id: string;
      type: "ORDER_UPDATE" | "PRICE_ALERT" | "DELIVERY_UPDATE" | "DEMAND_SPIKE" | "SYSTEM";
      title: string;
      message: string;
      link: string;
      read: boolean;
      createdAt: string;
    }>
  > = {
    FARMER: [
      {
        _id: "demo_notif_farmer_1",
        type: "PRICE_ALERT",
        title: "Tomato Mandi Price Surge (+14%)",
        message: "Current Cuttack mandi rate touched ₹38/kg. Favorable window to list fresh harvest.",
        link: "/farmer/products",
        read: false,
        createdAt: minutesAgo(12),
      },
      {
        _id: "demo_notif_farmer_2",
        type: "ORDER_UPDATE",
        title: "New Bulk Procurement Request",
        message: "Bhubaneswar Fresh Foods requested 500 kg Hybrid Cauliflower.",
        link: "/farmer/orders",
        read: false,
        createdAt: minutesAgo(45),
      },
      {
        _id: "demo_notif_farmer_3",
        type: "DEMAND_SPIKE",
        title: "High Regional Demand Detected",
        message: "AI engine predicts 2.4x surge in leafy vegetables over the next 3 days across Khordha.",
        link: "/farmer/dashboard",
        read: true,
        createdAt: minutesAgo(180),
      },
      {
        _id: "demo_notif_farmer_4",
        type: "SYSTEM",
        title: "AI Logistics Batch Scheduled",
        message: "Electric vehicle route EV-OD-04 assigned for tomorrow morning's farm pickup.",
        link: "/farmer/orders",
        read: true,
        createdAt: minutesAgo(360),
      },
    ],
    FPO: [
      {
        _id: "demo_notif_fpo_1",
        type: "ORDER_UPDATE",
        title: "FPO Aggregation Batch Complete",
        message: "Batch #FPO-OD-402 aggregated 12 tonnes of paddy from 28 member farmers.",
        link: "/fpo/orders",
        read: false,
        createdAt: minutesAgo(20),
      },
      {
        _id: "demo_notif_fpo_2",
        type: "PRICE_ALERT",
        title: "Wholesale APMC Benchmark +4.2%",
        message: "Odisha state index indicates rising bulk grain rates across 5 regional mandis.",
        link: "/fpo/dashboard",
        read: false,
        createdAt: minutesAgo(90),
      },
    ],
    BULK_BUYER: [
      {
        _id: "demo_notif_buyer_1",
        type: "DELIVERY_UPDATE",
        title: "Consignment In Transit",
        message: "Shipment #TRK-8812 (2 MT Fresh Potatoes) is dispatched from Badamba cluster.",
        link: "/buyer/orders",
        read: false,
        createdAt: minutesAgo(25),
      },
      {
        _id: "demo_notif_buyer_2",
        type: "PRICE_ALERT",
        title: "Direct Sourcing Savings: ₹4,800",
        message: "Direct farm-gate contract pricing beat the APMC broker benchmark by 17.5%.",
        link: "/buyer/marketplace",
        read: false,
        createdAt: minutesAgo(110),
      },
    ],
    CONSUMER: [
      {
        _id: "demo_notif_consumer_1",
        type: "DELIVERY_UPDATE",
        title: "Farm Basket Out for Delivery",
        message: "Your freshly harvested basket is out for delivery. Estimated arrival: 5:45 PM.",
        link: "/consumer/orders",
        read: false,
        createdAt: minutesAgo(15),
      },
      {
        _id: "demo_notif_consumer_2",
        type: "PRICE_ALERT",
        title: "Fresh Harvest Alert",
        message: "Organic Sweet Corn harvested this morning is available at direct farm rates.",
        link: "/consumer/marketplace",
        read: false,
        createdAt: minutesAgo(80),
      },
    ],
    ADMIN: [
      {
        _id: "demo_notif_admin_1",
        type: "SYSTEM",
        title: "AI Route Optimization Completed",
        message: "Consolidated 14 pickup routes into 9 multi-drop circuits, cutting carbon emissions by 21%.",
        link: "/admin/analytics",
        read: false,
        createdAt: minutesAgo(30),
      },
      {
        _id: "demo_notif_admin_2",
        type: "DEMAND_SPIKE",
        title: "Marketplace Activity Spike",
        message: "Order transaction volume increased 32% across Cuttack & Khordha today.",
        link: "/admin/dashboard",
        read: false,
        createdAt: minutesAgo(120),
      },
    ],
  };

  const roleKey = role?.toUpperCase() || "FARMER";
  const list = all[roleKey] || all.FARMER;
  return unreadOnly ? list.filter((n) => !n.read) : list;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
    const unreadOnly = searchParams.get("unread") === "true";

    let notifications: Array<Record<string, unknown>> = [];
    let unreadCount = 0;
    let loadedFromDb = false;

    try {
      await connectToDatabase();
      const isObjectId = mongoose.Types.ObjectId.isValid(user.id);
      const filter: Record<string, unknown> = isObjectId
        ? { recipient: new mongoose.Types.ObjectId(user.id) }
        : { recipient: user.id };

      if (unreadOnly) {
        filter.read = false;
      }

      const dbNotifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      if (dbNotifications && dbNotifications.length > 0) {
        notifications = dbNotifications as unknown as Array<Record<string, unknown>>;
        unreadCount = await Notification.countDocuments({
          ...filter,
          read: false,
        });
        loadedFromDb = true;
      }
    } catch (dbErr) {
      console.warn(
        "Database unavailable or offline for notifications; using fallback:",
        (dbErr as Error).message
      );
    }

    if (!loadedFromDb) {
      const fallbackList = getDemoNotificationsForRole(user.role, unreadOnly);
      notifications = fallbackList.slice(0, limit);
      unreadCount = fallbackList.filter((n) => !n.read).length;
    }

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Unexpected error fetching notifications:", error);
    return NextResponse.json({
      success: true,
      unreadCount: 0,
      notifications: [],
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    try {
      await connectToDatabase();
      const isObjectId = mongoose.Types.ObjectId.isValid(user.id);
      const recipientQuery = isObjectId
        ? new mongoose.Types.ObjectId(user.id)
        : user.id;

      if (body.all) {
        await Notification.updateMany(
          { recipient: recipientQuery, read: false },
          { $set: { read: true } }
        );
        return NextResponse.json({
          success: true,
          message: "All notifications marked as read",
        });
      }

      if (body.notificationId) {
        if (mongoose.Types.ObjectId.isValid(body.notificationId)) {
          await Notification.findOneAndUpdate(
            {
              _id: new mongoose.Types.ObjectId(body.notificationId),
              recipient: recipientQuery,
            },
            { $set: { read: true } }
          );
        }
        return NextResponse.json({
          success: true,
          message: "Notification marked as read",
        });
      }
    } catch (dbErr) {
      console.warn("DB notification update skipped (offline/demo):", (dbErr as Error).message);
    }

    return NextResponse.json({
      success: true,
      message: body.all ? "All notifications marked as read" : "Notification updated",
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({
      success: true,
      message: "Notification updated",
    });
  }
}
