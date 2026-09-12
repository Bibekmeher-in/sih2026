import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
// Delivery partners client component
import DeliveryPartnersClient from "@/components/admin/delivery-partners-client";

export const metadata: Metadata = {
  title: "Delivery Partners Management | KISANOVA Admin",
  description: "Driver Verification, Fleet Availability & Performance Oversight",
};

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPartnersPage() {
  await requireRole([USER_ROLES.ADMIN]);
  return <DeliveryPartnersClient />;
}
