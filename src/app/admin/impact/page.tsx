import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getAgriculturalImpactData } from "@/lib/impact-service";
import { ImpactDashboardClient } from "@/components/impact/impact-dashboard-client";

export const metadata: Metadata = {
  title: "Agricultural Impact Console | KisanDirect Admin",
  description: "SIH Problem Statement Metrics, Value Chain Disintermediation & Econometric Spread Oversight",
};

export const dynamic = "force-dynamic";

export default async function AdminImpactPage() {
  await requireRole([USER_ROLES.ADMIN]);
  const report = await getAgriculturalImpactData();

  return (
    <div className="agri-container">
      <ImpactDashboardClient initialReport={report} isAdminView={true} />
    </div>
  );
}
