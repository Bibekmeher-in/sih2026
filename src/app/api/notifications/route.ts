import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Notification } from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
    const unreadOnly = searchParams.get("unread") === "true";

    const filter: Record<string, unknown> = { recipient: user.id };
    if (unreadOnly) {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: user.id,
      read: false,
    });

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 }
    );
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

    await connectToDatabase();
    const body = await req.json();

    if (body.all) {
      await Notification.updateMany(
        { recipient: user.id, read: false },
        { $set: { read: true } }
      );
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (body.notificationId) {
      await Notification.findOneAndUpdate(
        { _id: body.notificationId, recipient: user.id },
        { $set: { read: true } }
      );
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json(
      { success: false, message: "Invalid request payload" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
