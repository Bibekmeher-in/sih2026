import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { AdminUsersClient } from "@/components/admin/users-client";

export const metadata: Metadata = {
  title: "FPO Clusters | KisanDirect Admin",
  description: "Farmer Producer Organizations & Aggregation Center Management",
};

export const dynamic = "force-dynamic";

export default async function AdminFposPage() {
  await requireRole([USER_ROLES.ADMIN]);

  return (
    <AdminUsersClient
      initialRole="FPO"
      title="Farmer Producer Organizations (FPOs)"
      subtitle="Federated agricultural collectives, packhouse operations, and member growers"
    />
  );
}
