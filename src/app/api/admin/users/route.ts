import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

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
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    // Cap at 100 rows per page to prevent excessive DB reads
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (role && role !== "ALL") {
      query.role = role;
    }

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { "location.district": { $regex: search, $options: "i" } },
        { "location.state": { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    console.error("Admin GET users error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
