import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import "@/models";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    // Cap at 100 rows per page to prevent excessive DB reads
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      query.orderStatus = status;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "items.productName": { $regex: search, $options: "i" } },
        { "deliveryAddress.recipientName": { $regex: search, $options: "i" } },
        { "deliveryAddress.district": { $regex: search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("buyer", "name email phone role")
        .populate("seller", "name email phone role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    console.error("Admin GET orders error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
