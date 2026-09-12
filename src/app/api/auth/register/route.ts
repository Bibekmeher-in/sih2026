import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { registerSchema } from "@/schemas";
import { USER_ROLES, USER_STATUSES } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Zod Validation
    const validation = registerSchema.safeParse(body);
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

    const { name, email, password, phone, role, district, state } =
      validation.data;

    // 2. Strict Security: Block any attempts to publicly create ADMIN accounts
    if (role === ("ADMIN" as unknown)) {
      return NextResponse.json(
        {
          success: false,
          message: "Security violation: Admin accounts cannot be created publicly.",
        },
        { status: 403 }
      );
    }

    // 3. Connect to Database
    try {
      await connectToDatabase();
    } catch (dbErr: unknown) {
      console.error("Database connection failed during registration:", dbErr);
      return NextResponse.json(
        {
          success: false,
          message:
            "Database service is currently unreachable. Please ensure MongoDB is running (or run 'npm run db:start').",
        },
        { status: 503 }
      );
    }

    // 4. Check for existing user
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email address already exists.",
        },
        { status: 409 }
      );
    }

    // 5. Securely hash password (Salt rounds = 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // 6. Save new user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role as keyof typeof USER_ROLES,
      phone,
      status: USER_STATUSES.ACTIVE,
      location: {
        district: district || "",
        state: state || "",
      },
    });

    // 7. If Delivery Partner, auto-provision DeliveryPartnerProfile
    if (role === USER_ROLES.DELIVERY_PARTNER) {
      const vType = body.vehicleType || "BIKE";
      const vPlate = body.vehicleNumber || `OD-02-${Math.floor(1000 + Math.random() * 9000)}`;
      const capacityKg =
        vType === "TRUCK"
          ? 2500
          : vType === "PICKUP_TRUCK"
          ? 1000
          : vType === "AUTO_RICKSHAW"
          ? 300
          : 50;

      const profile = await DeliveryPartnerProfile.create({
        user: newUser._id,
        fullName: name,
        email: email.toLowerCase(),
        phone: phone || "",
        vehicleType: vType,
        vehicleNumber: vPlate,
        vehicleCapacityKg: capacityKg,
        verificationStatus: "VERIFIED",
        isOnline: true,
        isAvailableForAssignment: true,
        serviceArea: {
          city: district || "Bhubaneswar",
          state: state || "Odisha",
          radiusKm: 30,
        },
        currentLocation: {
          type: "Point",
          coordinates: [85.8245, 20.2961],
          latitude: 20.2961,
          longitude: 85.8245,
          updatedAt: new Date(),
        },
        documents: {
          drivingLicenseNumber: body.drivingLicense || "PENDING_VERIFICATION",
        },
      });

      await User.findByIdAndUpdate(newUser._id, {
        deliveryPartnerProfile: profile._id,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. You may now sign in.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred during registration. Please try again.",
      },
      { status: 500 }
    );
  }
}
