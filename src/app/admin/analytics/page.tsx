import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { AdminAnalyticsClient } from "@/components/admin/analytics-client";

export const metadata: Metadata = {
  title: "Platform Analytics & Business Intelligence | KisanDirect Admin",
  description: "Executive Agritech Econometrics, Monthly GMV, Category Demand & Delivery SLAs",
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireRole([USER_ROLES.ADMIN]);

  return <AdminAnalyticsClient />;
}
