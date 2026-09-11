import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFpoProfile, updateFpoProfile } from "@/lib/fpo-community-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const fpoId = user?.id || "default";

    const profile = await getFpoProfile(fpoId);
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error fetching FPO profile:", error);
    const message = (error as Error)?.message || "Failed to fetch FPO profile";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const profile = await updateFpoProfile(user.id, body);
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error updating FPO profile:", error);
    const message = (error as Error)?.message || "Failed to update FPO profile";
    return NextResponse.json({ message }, { status: 500 });
  }
}
