import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getGroupById } from "@/lib/fpo-community-service";
import { FarmerGroup } from "@/models/FarmerGroup";
import { connectToDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const group = await getGroupById(id, user?.id);

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error("Error fetching group details:", error);
    const message = (error as Error)?.message || "Failed to fetch group details";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    await connectToDatabase();
    const group = await FarmerGroup.findById(id);
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    // Only owner/creator, FPO, or Admin can edit group
    if (group.creatorId.toString() !== user.id && user.role !== "ADMIN" && user.role !== "FPO") {
      return NextResponse.json({ message: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    if (body.name) group.name = body.name;
    if (body.description) group.description = body.description;
    if (body.category) group.category = body.category;
    if (body.product) group.product = body.product;
    if (body.privacy) group.privacy = body.privacy;

    await group.save();
    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error("Error updating group:", error);
    const message = (error as Error)?.message || "Failed to update group";
    return NextResponse.json({ message }, { status: 500 });
  }
}
