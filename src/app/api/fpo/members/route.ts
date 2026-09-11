import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listMembers } from "@/lib/fpo-community-service";
import { GroupMembership } from "@/models/GroupMembership";
import { connectToDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const fpoId = searchParams.get("fpoId") || (user?.role === "FPO" ? user.id : undefined);

    const members = await listMembers(fpoId);
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("Error fetching FPO members:", error);
    const message = (error as Error)?.message || "Failed to fetch members";
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
    const { membershipId, status, role } = body;
    if (!membershipId) {
      return NextResponse.json({ message: "membershipId is required" }, { status: 400 });
    }

    await connectToDatabase();
    const membership = await GroupMembership.findById(membershipId);
    if (!membership) {
      return NextResponse.json({ message: "Membership not found" }, { status: 404 });
    }

    if (status) membership.status = status;
    if (role) membership.role = role;

    await membership.save();
    return NextResponse.json({ success: true, membership });
  } catch (error) {
    console.error("Error updating member:", error);
    const message = (error as Error)?.message || "Failed to update member";
    return NextResponse.json({ message }, { status: 500 });
  }
}
