import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES, USER_STATUSES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { FarmerProfile } from "@/models/FarmerProfile";
import { FPO } from "@/models/FPO";
import { BuyerProfile } from "@/models/BuyerProfile";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;

    const userDoc = await User.findById(id).select("-passwordHash").lean();
    if (!userDoc) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    let extraProfile = null;
    let products: unknown[] = [];
    let orders: unknown[] = [];

    if (userDoc.role === USER_ROLES.FARMER) {
      extraProfile = await FarmerProfile.findOne({ user: id }).lean();
      products = await Product.find({ seller: id }).limit(10).lean();
      orders = await Order.find({ seller: id }).limit(10).lean();
    } else if (userDoc.role === USER_ROLES.FPO) {
      extraProfile = await FPO.findOne({ adminUser: id }).lean();
      products = await Product.find({ seller: id }).limit(10).lean();
      orders = await Order.find({ seller: id }).limit(10).lean();
    } else if (userDoc.role === USER_ROLES.BULK_BUYER || userDoc.role === USER_ROLES.CONSUMER) {
      extraProfile = await BuyerProfile.findOne({ user: id }).lean();
      orders = await Order.find({ buyer: id }).limit(10).lean();
    }

    return NextResponse.json({
      success: true,
      data: {
        user: userDoc,
        profile: extraProfile,
        products,
        orders,
      },
    });
  } catch (error: unknown) {
    console.error("Admin GET user details error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = Object.values(USER_STATUSES);
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: "after" }
    ).select("-passwordHash");

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User status successfully updated to ${status}`,
    });
  } catch (error: unknown) {
    console.error("Admin PATCH user status error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
