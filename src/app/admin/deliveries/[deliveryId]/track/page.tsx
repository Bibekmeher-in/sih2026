import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { ArrowLeft } from "lucide-react";
// Client tracker component
import AdminDeliveryTrackerClient from "@/components/admin/delivery-tracker-client";

export const metadata: Metadata = {
  title: "Live Delivery Tracking | KISANOVA Admin",
  description: "Real-time GPS Dispatch & Driver Telemetry Tracking",
};

export const dynamic = "force-dynamic";

export default async function AdminDeliveryTrackPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  await requireRole([USER_ROLES.ADMIN]);
  const { deliveryId } = await params;

  await connectToDatabase();
  const delivery = await Delivery.findById(deliveryId)
    .populate("assignedPartner", "name email phone avatar")
    .populate("order", "orderNumber total orderStatus items deliveryAddress deliveryOtp buyerType")
    .lean();

  if (!delivery) {
    notFound();
  }

  const serializedDelivery = JSON.parse(JSON.stringify(delivery));

  return (
    <div className="agri-container space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/deliveries"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Delivery Dispatches</span>
        </Link>
      </div>

      <AdminDeliveryTrackerClient delivery={serializedDelivery} />
    </div>
  );
}
