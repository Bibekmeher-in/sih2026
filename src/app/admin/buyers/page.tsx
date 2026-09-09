import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { AdminUsersClient } from "@/components/admin/users-client";

export const metadata: Metadata = {
  title: "Buyer Accounts | KisanDirect Admin",
  description: "Wholesale Institutional Buyers & Consumer Account Management",
};

export const dynamic = "force-dynamic";

export default async function AdminBuyersPage() {
  await requireRole([USER_ROLES.ADMIN]);

  return (
    <AdminUsersClient
      initialRole="BULK_BUYER"
      title="Commercial & Consumer Buyers"
      subtitle="B2B wholesale processors, hotel/restaurant/catering procurement, and retail households"
    />
  );
}
