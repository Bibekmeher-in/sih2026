import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const verificationStatus = searchParams.get("verificationStatus") || "";
    const isOnlineParam = searchParams.get("isOnline");
    const isAvailableParam = searchParams.get("isAvailable");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (verificationStatus && verificationStatus !== "ALL") {
      query.verificationStatus = verificationStatus;
    }

    if (isOnlineParam === "true") query.isOnline = true;
    if (isOnlineParam === "false") query.isOnline = false;

    if (isAvailableParam === "true") query.isAvailableForAssignment = true;
    if (isAvailableParam === "false") query.isAvailableForAssignment = false;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { vehicleNumber: { $regex: search, $options: "i" } },
        { "serviceArea.city": { $regex: search, $options: "i" } },
      ];
    }

    const [partners, total] = await Promise.all([
      DeliveryPartnerProfile.find(query)
        .populate("user", "name email phone status avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeliveryPartnerProfile.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        partners,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/admin/delivery-partners error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
