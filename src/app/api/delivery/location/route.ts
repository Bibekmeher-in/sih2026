import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { Delivery } from "@/models/Delivery";
import { deliveryLocationUpdateSchema } from "@/schemas";

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
    const validation = deliveryLocationUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid GPS coordinates",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { latitude, longitude, accuracy } = validation.data;
    await connectToDatabase();

    const now = new Date();

    // 1. Update Delivery Partner Profile
    const profile = await DeliveryPartnerProfile.findOneAndUpdate(
      { user: user.id },
      {
        $set: {
          "currentLocation.latitude": latitude,
          "currentLocation.longitude": longitude,
          "currentLocation.accuracy": accuracy || 10,
          "currentLocation.updatedAt": now,
          "currentLocation.locationGeo": {
            type: "Point",
            coordinates: [longitude, latitude], // GeoJSON order: [longitude, latitude]
          },
          lastActiveAt: now,
        },
      },
      { returnDocument: "after" }
    );

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Delivery Partner profile not found" },
        { status: 404 }
      );
    }

    // 2. Also update any active in-transit delivery for this partner
    await Delivery.updateMany(
      {
        assignedPartner: user.id,
        status: { $in: ["ACCEPTED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "ARRIVED_AT_DESTINATION", "OUT_FOR_DELIVERY"] },
      },
      {
        $set: {
          "currentLocation.latitude": latitude,
          "currentLocation.longitude": longitude,
          "currentLocation.accuracy": accuracy || 10,
          "currentLocation.updatedAt": now,
          "currentLocation.locationGeo": {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Location telemetry recorded",
      location: {
        latitude,
        longitude,
        accuracy,
        updatedAt: now,
      },
    });
  } catch (error: unknown) {
    console.error("POST /api/delivery/location error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
