import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import DeliveryPartnerDetailClient from "@/components/admin/delivery-partner-detail-client";

export const metadata: Metadata = {
  title: "Delivery Partner Profile | KISANOVA Admin",
  description: "Driver Dossier, Vehicle Specifications, KYC and Order History",
};

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole([USER_ROLES.ADMIN]);
  const { id } = await params;

  return <DeliveryPartnerDetailClient partnerId={id} />;
}
