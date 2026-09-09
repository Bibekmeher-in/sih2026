import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { AdminUsersClient } from "@/components/admin/users-client";

export const metadata: Metadata = {
  title: "User Directory | KISANOVA Admin",
  description: "Comprehensive User Account Management & Status Moderation",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole([USER_ROLES.ADMIN]);

  return (
    <AdminUsersClient
      initialRole="ALL"
      title="User Account Directory"
      subtitle="Oversight across farmers, FPOs, wholesale procurement managers, and consumers"
    />
  );
}
