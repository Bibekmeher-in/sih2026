import { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { getAgriculturalImpactData } from "@/lib/impact-service";
import { ImpactDashboardClient } from "@/components/impact/impact-dashboard-client";

export const metadata: Metadata = {
  title: "Agricultural Impact & Socioeconomic Realization | KISANOVA",
  description: "SIH Problem Statement Validation: Higher farmer realizations, lower consumer food prices, and reduced logistics waste.",
};

export const dynamic = "force-dynamic";

export default async function PublicImpactPage() {
  const report = await getAgriculturalImpactData();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70">
      <Navbar />
      <main className="flex-1 py-8 sm:py-12">
        <div className="agri-container">
          <ImpactDashboardClient initialReport={report} isAdminView={false} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
