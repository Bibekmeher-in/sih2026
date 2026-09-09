import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getFarmerAiHubData } from "@/lib/ai-forecast-pricing";
import FarmerAiInsightsClient from "@/components/farmer/ai-insights-client";

export const metadata: Metadata = {
  title: "AI Agronomic & Price Intelligence | KISANOVA",
  description: "AI-driven demand forecasts, econometric price recommendations, and dedicated agricultural advisory copilot.",
};

export const dynamic = "force-dynamic";

export default async function FarmerAiInsightsPage() {
  const user = await requireRole([USER_ROLES.FARMER, USER_ROLES.FPO]);
  const initialData = await getFarmerAiHubData(user.id);
  const serializedData = JSON.parse(JSON.stringify(initialData));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <FarmerAiInsightsClient initialData={serializedData} />
    </div>
  );
}
