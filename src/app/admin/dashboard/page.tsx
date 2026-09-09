import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getAdminDashboardData } from "@/lib/admin-service";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";

export const metadata: Metadata = {
  title: "Admin Executive Overview | KisanDirect",
  description: "National Agritech Oversight, Moderation & Logistics Command Console",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardRoutePage() {
  await requireRole([USER_ROLES.ADMIN]);
  const data = await getAdminDashboardData();

  return <AdminDashboardClient initialData={data} />;
}
