import { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { DeliveryPartnerProfile } from "@/models/DeliveryPartnerProfile";
import { ArrowLeft } from "lucide-react";
// Client fleet map component
import AdminFleetMapClient from "@/components/admin/fleet-map-client";

export const metadata: Metadata = {
  title: "Fleet & Dispatches Map | KISANOVA Admin",
  description: "Live Spatial Overview of Active Deliveries, Drivers & Collection Hubs",
};

export const dynamic = "force-dynamic";

export default async function AdminDeliveriesMapPage() {
  await requireRole([USER_ROLES.ADMIN]);
  await connectToDatabase();

  const [activeDeliveries, partners] = await Promise.all([
    Delivery.find({
      status: {
        $in: ["ASSIGNED", "ACCEPTED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "ARRIVED_AT_DESTINATION", "OUT_FOR_DELIVERY"],
      },
    })
      .populate("assignedPartner", "name phone")
      .populate("order", "orderNumber total items")
      .lean(),
    DeliveryPartnerProfile.find({ isOnline: true })
      .populate("user", "name phone")
      .lean(),
  ]);

  const serializedDeliveries = JSON.parse(JSON.stringify(activeDeliveries));
  const serializedPartners = JSON.parse(JSON.stringify(partners));

  return (
    <div className="agri-container space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/deliveries"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Delivery Ledger</span>
        </Link>
      </div>

      <AdminFleetMapClient
        deliveries={serializedDeliveries}
        partners={serializedPartners}
      />
    </div>
  );
}
