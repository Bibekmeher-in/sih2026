import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getFarmerProfile, updateFarmerProfile } from "@/lib/farmer-service";
import { farmerProfileFormSchema } from "@/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.FARMER) {
      return NextResponse.json(
        { message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const profile = await getFarmerProfile(user.id);
    return NextResponse.json({ success: true, profile });
  } catch {
    return NextResponse.json(
      { message: "Failed to load farmer profile. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.FARMER) {
      return NextResponse.json(
        { message: "Unauthorized: Farmer credentials required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = farmerProfileFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    await updateFarmerProfile(user.id, parsed.data);
    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch {
    return NextResponse.json(
      { message: "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}

