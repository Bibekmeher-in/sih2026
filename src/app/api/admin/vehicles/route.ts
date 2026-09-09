import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getVehicles, createVehicle } from "@/lib/logistics-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const vehicles = await getVehicles(status);
    return NextResponse.json({ success: true, count: vehicles.length, vehicles });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.registrationNumber || !body.driverName || !body.driverPhone) {
      return NextResponse.json(
        { success: false, message: "Registration number, driver name, and phone are required" },
        { status: 400 }
      );
    }

    const newVehicle = await createVehicle({
      registrationNumber: body.registrationNumber,
      vehicleClass: body.vehicleClass || "TATA_ACE",
      modelName: body.modelName || "Tata Ace Gold",
      payloadCapacityKg: Number(body.payloadCapacityKg) || 1200,
      fuelType: body.fuelType || "DIESEL",
      isRefrigerated: Boolean(body.isRefrigerated),
      driverName: body.driverName,
      driverPhone: body.driverPhone,
      baseHub: body.baseHub,
    });

    return NextResponse.json({ success: true, vehicle: newVehicle }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create vehicle. Please try again." },
      { status: 500 }
    );
  }
}

