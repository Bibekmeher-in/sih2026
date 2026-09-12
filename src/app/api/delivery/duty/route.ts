import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== USER_ROLES.DELIVERY_PARTNER && user.role !== USER_ROLES.ADMIN)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Delivery Partner access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { isOnline } = body;

    if (typeof isOnline !== "boolean") {
      return NextResponse.json(
        { success: false, message: "isOnline boolean field is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const profile = await DeliveryPartnerProfile.findOne({ user: user.id });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Delivery Partner profile not found. Please complete onboarding." },
        { status: 404 }
      );
    }

    // Only VERIFIED partners can go online
    if (isOnline && profile.verificationStatus !== "VERIFIED") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot go online. Account verification status is '${profile.verificationStatus}'. Wait for Admin verification.`,
        },
        { status: 403 }
      );
    }

    profile.isOnline = isOnline;
    profile.lastActiveAt = new Date();
    await profile.save();

    return NextResponse.json({
      success: true,
      message: isOnline ? "You are now ONLINE and ready for dispatches." : "You are now OFFLINE.",
      isOnline: profile.isOnline,
    });
  } catch (error: unknown) {
    console.error("POST /api/delivery/duty error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
