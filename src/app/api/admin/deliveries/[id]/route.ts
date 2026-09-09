import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { assignVehicleAndRoute, updateDeliveryStatus } from "@/lib/logistics-service";
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
      return NextResponse.json({ success: false, message: "Invalid delivery ID" }, { status: 400 });
    }

    const body = await req.json();

    // 1. Vehicle & Route Assignment
    if (body.vehicleId) {
      const assigned = await assignVehicleAndRoute(id, body.vehicleId, body.routeId);
      return NextResponse.json({ success: true, delivery: assigned });
    }

    // 2. Status Progression
    if (body.status) {
      const updated = await updateDeliveryStatus(id, body.status, body.telemetry);
      return NextResponse.json({ success: true, delivery: updated });
    }

    return NextResponse.json(
      { success: false, message: "No actionable fields (vehicleId or status) provided" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Error updating delivery:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update delivery. Please try again." },
      { status: 500 }
    );
  }
}

