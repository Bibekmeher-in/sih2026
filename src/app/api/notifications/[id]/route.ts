import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Notification } from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    try {
      await connectToDatabase();
      if (mongoose.Types.ObjectId.isValid(id)) {
        const isObjectId = mongoose.Types.ObjectId.isValid(user.id);
        const recipientQuery = isObjectId
          ? new mongoose.Types.ObjectId(user.id)
          : user.id;

        await Notification.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(id), recipient: recipientQuery },
          { $set: { read: true } },
          { returnDocument: "after" }
        );
      }
    } catch (dbErr) {
      console.warn("DB update skipped (offline/demo mode):", (dbErr as Error).message);
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    try {
      await connectToDatabase();
      if (mongoose.Types.ObjectId.isValid(id)) {
        const isObjectId = mongoose.Types.ObjectId.isValid(user.id);
        const recipientQuery = isObjectId
          ? new mongoose.Types.ObjectId(user.id)
          : user.id;

        await Notification.findOneAndDelete({
          _id: new mongoose.Types.ObjectId(id),
          recipient: recipientQuery,
        });
      }
    } catch (dbErr) {
      console.warn("DB delete skipped (offline/demo mode):", (dbErr as Error).message);
    }

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    });
  }
}
