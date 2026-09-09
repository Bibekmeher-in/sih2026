import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { AdminUsersClient } from "@/components/admin/users-client";

export const metadata: Metadata = {
  title: "Farmers Directory | KISANOVA Admin",
  description: "Direct Agricultural Producer Directory & Verification Management",
};

export const dynamic = "force-dynamic";

export default async function AdminFarmersPage() {
  await requireRole([USER_ROLES.ADMIN]);

  return (
    <AdminUsersClient
      initialRole="FARMER"
      title="Registered Farmer Directory"
      subtitle="Direct agricultural growers, landholding details, and crop listing verification"
    />
  );
}
