import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";

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
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const sellerType = searchParams.get("sellerType") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (sellerType && sellerType !== "ALL") {
      query.sellerType = sellerType;
    }

    if (category && category !== "ALL") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sellerName: { $regex: search, $options: "i" } },
        { "location.district": { $regex: search, $options: "i" } },
        { "location.state": { $regex: search, $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("seller", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    console.error("Admin GET products error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
