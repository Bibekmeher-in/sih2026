import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { AuditLog } from "@/models/AuditLog";
import { deliveryPartnerOnboardingSchema } from "@/schemas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Sign in to complete onboarding" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = deliveryPartnerOnboardingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    await connectToDatabase();

    const profileData = {
      user: user.id,
      fullName: data.fullName,
      phone: data.phone,
      email: user.email || "",
      verificationStatus: "PENDING_VERIFICATION" as const,
      vehicleType: data.vehicleType,
      vehicleNumber: data.vehicleNumber.toUpperCase().trim(),
      vehicleCapacityKg: data.vehicleCapacityKg,
      documents: {
        governmentIdType: data.governmentIdType,
        governmentIdNumber: data.governmentIdNumber.trim(),
        drivingLicenseNumber: data.drivingLicenseNumber.trim(),
        drivingLicenseExpiry: data.drivingLicenseExpiry
          ? new Date(data.drivingLicenseExpiry)
          : undefined,
        vehicleRegistrationNumber: data.vehicleRegistrationNumber.trim(),
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
      },
      serviceArea: {
        city: data.city.trim(),
        radiusKm: data.radiusKm || 30,
      },
    };

    const updatedProfile = await DeliveryPartnerProfile.findOneAndUpdate(
      { user: user.id },
      { $set: profileData },
      { upsert: true, returnDocument: "after" }
    );

    // Link in User model and update role to DELIVERY_PARTNER
    await User.findByIdAndUpdate(user.id, {
      role: USER_ROLES.DELIVERY_PARTNER,
      deliveryPartnerProfile: updatedProfile._id,
      phone: data.phone,
    });

    await AuditLog.create({
      actor: user.id,
      actorRole: "DELIVERY_PARTNER",
      action: "DELIVERY_PARTNER_ONBOARDING_SUBMITTED",
      entity: "DeliveryPartnerProfile",
      entityId: updatedProfile._id,
      metadata: {
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        city: data.city,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding documents submitted. Your account is pending verification by KISANOVA Admin.",
      data: updatedProfile,
    });
  } catch (error: unknown) {
    console.error("POST /api/delivery/onboarding error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
