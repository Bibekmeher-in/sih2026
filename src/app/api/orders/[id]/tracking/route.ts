import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { Delivery } from "@/models/Delivery";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order = await Order.findById(id)
      .populate("buyer", "name email phone role")
      .populate("seller", "name email phone role")
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Role-based authorization
    const buyerId = order.buyer && (order.buyer as { _id?: unknown })._id
      ? (order.buyer as { _id: unknown })._id?.toString()
      : order.buyer?.toString();

    const sellerId = order.seller && (order.seller as { _id?: unknown })._id
      ? (order.seller as { _id: unknown })._id?.toString()
      : order.seller?.toString();

    const isBuyer = buyerId === user.id;
    const isSeller = sellerId === user.id;
    const isAdmin = user.role === "ADMIN";
    const isLogistics = (user.role as string) === "LOGISTICS" || user.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin && !isLogistics) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You do not have permission to track this order" },
        { status: 403 }
      );
    }

    // Lookup linked Delivery document
    const delivery = await Delivery.findOne({ order: order._id })
      .populate("vehicle")
      .populate("assignedPartner", "name phone avatar")
      .lean();

    // Resolve delivery partner profile if assigned
    let partnerInfo: {
      name: string;
      phone: string;
      vehicleType: string;
      vehicleNumber: string;
    } | null = null;

    if (delivery?.assignedPartner) {
      const partnerUser = delivery.assignedPartner as any;
      const partnerUserId = partnerUser._id || partnerUser;
      const profile = await DeliveryPartnerProfile.findOne({ user: partnerUserId }).lean();
      if (profile) {
        partnerInfo = {
          name: profile.fullName || partnerUser.name || "Delivery Partner",
          phone: profile.phone || partnerUser.phone || "",
          vehicleType: profile.vehicleType || "BIKE",
          vehicleNumber: profile.vehicleNumber || "",
        };
      }
    }

    // Determine current location & last updated text
    let currentLocation: { latitude: number; longitude: number; updatedAt?: Date } | null = null;
    let lastLocationUpdate = "Live location is currently unavailable.";

    if (delivery?.currentLocation?.latitude && delivery?.currentLocation?.longitude) {
      currentLocation = {
        latitude: delivery.currentLocation.latitude,
        longitude: delivery.currentLocation.longitude,
        updatedAt: delivery.currentLocation.updatedAt,
      };

      if (delivery.currentLocation.updatedAt) {
        const diffMinutes = Math.floor(
          (Date.now() - new Date(delivery.currentLocation.updatedAt).getTime()) / (60 * 1000)
        );
        lastLocationUpdate =
          diffMinutes <= 1
            ? "Updated just now"
            : `Updated ${diffMinutes} minutes ago`;
      }
    }

    // Coordinates fallback if not set
    const pickupLocation = delivery?.pickupLocation || {
      name: "Farm Gate Hub",
      address: "Odisha Farm Gate Cluster",
      district: "Cuttack",
      state: "Odisha",
      latitude: 20.4625,
      longitude: 85.8828,
      contactPhone: "9822012345",
    };

    const destinationLocation = delivery?.destination || {
      name: order.deliveryAddress?.recipientName || "Delivery Doorstep",
      address: order.deliveryAddress?.addressLine || "",
      district: order.deliveryAddress?.district || "Khordha",
      state: order.deliveryAddress?.state || "Odisha",
      latitude: order.deliveryAddress?.coordinates?.latitude || 20.2961,
      longitude: order.deliveryAddress?.coordinates?.longitude || 85.8245,
      contactPhone: order.deliveryAddress?.recipientPhone || "",
    };

    // Route waypoint polyline coordinates
    const routeCoordinates: [number, number][] = [
      [pickupLocation.latitude, pickupLocation.longitude],
    ];

    if (currentLocation && ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.orderStatus)) {
      routeCoordinates.push([currentLocation.latitude, currentLocation.longitude]);
    }

    routeCoordinates.push([destinationLocation.latitude, destinationLocation.longitude]);

    // Format status history
    const statusHistory = (order.statusHistory || []).map((h) => ({
      status: h.status,
      timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
      note: h.note || "",
    }));

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      deliveryStatus: delivery?.status || order.orderStatus,
      estimatedDelivery: order.estimatedDeliveryAt
        ? new Date(order.estimatedDeliveryAt).toISOString()
        : null,
      deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : null,
      cancelledAt: order.cancelledAt ? new Date(order.cancelledAt).toISOString() : null,
      currentLocation,
      lastLocationUpdate,
      pickupLocation,
      destinationLocation,
      route: routeCoordinates,
      statusHistory,
      // OTP is exposed to the buyer so they can verify upon doorstep delivery
      deliveryOtp: isBuyer || isAdmin ? order.deliveryOtp : undefined,
      otpVerified: order.otpVerified || delivery?.isOtpVerified || false,
      carrierInfo: delivery
        ? {
            trackingNumber: delivery.deliveryTrackingNumber,
            driverName: partnerInfo?.name || delivery.driverName || "Assigned Driver",
            driverPhone: partnerInfo?.phone || delivery.driverPhone || "",
            vehicleType: partnerInfo?.vehicleType || "FLEET",
            vehicleNumber: partnerInfo?.vehicleNumber || (delivery.vehicle as any)?.registrationNumber || "",
            temperatureCelsius: delivery.temperatureCelsius,
            assignmentStatus: delivery.assignmentStatus,
          }
        : null,
    });
  } catch (error) {
    console.error("Error retrieving order tracking:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve order tracking information" },
      { status: 500 }
    );
  }
}
