import React from "react";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getBulkRequirements } from "@/lib/buyer-service";
import { RequirementsClient } from "./requirements-client";

export const dynamic = "force-dynamic";

export default async function BuyerRequirementsPage() {
  const user = await requireRole([USER_ROLES.BULK_BUYER]);
  const requirements = await getBulkRequirements(user.id);
  const serializedRequirements = JSON.parse(JSON.stringify(requirements));

  return (
    <div className="agri-container space-y-6">
      <RequirementsClient initialRequirements={serializedRequirements} />
    </div>
  );
}
