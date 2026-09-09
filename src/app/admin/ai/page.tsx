import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { AdminAiClient } from "@/components/admin/ai-client";

export const metadata: Metadata = {
  title: "AI Agritech Telemetry & Intelligence | KISANOVA Admin",
  description: "Demand Forecasts, Econometric Price Corridors & Gemini Engine Reliability",
};

export const dynamic = "force-dynamic";

export default async function AdminAiPage() {
  await requireRole([USER_ROLES.ADMIN]);

  return <AdminAiClient />;
}
