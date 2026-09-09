import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { AdminOrdersClient } from "@/components/admin/orders-client";

export const metadata: Metadata = {
  title: "Order Fulfillment Ledger | KISANOVA Admin",
  description: "End-to-End Order Processing & Settlement Oversight",
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireRole([USER_ROLES.ADMIN]);

  return <AdminOrdersClient />;
}
