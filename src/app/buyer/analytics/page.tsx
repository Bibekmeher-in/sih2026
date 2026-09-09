import React from "react";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getBuyerAnalytics } from "@/lib/buyer-service";
import { AnalyticsClient } from "./analytics-client";

export const dynamic = "force-dynamic";

export default async function BuyerAnalyticsPage() {
  const user = await requireRole([USER_ROLES.BULK_BUYER]);
  const data = await getBuyerAnalytics(user.id);

  return (
    <div className="agri-container space-y-6">
      <AnalyticsClient data={data} />
    </div>
  );
}
