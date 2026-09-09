import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { updateVehicle } from "@/lib/logistics-service";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid vehicle ID" }, { status: 400 });
    }

    const body = await req.json();
    const updated = await updateVehicle(id, body);

    if (!updated) {
      return NextResponse.json({ success: false, message: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (error: unknown) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update vehicle. Please try again." },
      { status: 500 }
    );
  }
}

