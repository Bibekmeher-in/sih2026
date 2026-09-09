import React from "react";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getBuyerSuppliers } from "@/lib/buyer-service";
import { SuppliersClient } from "./suppliers-client";

export const dynamic = "force-dynamic";

export default async function BuyerSuppliersPage() {
  await requireRole([USER_ROLES.BULK_BUYER]);
  const initialSuppliers = await getBuyerSuppliers();
  const serializedSuppliers = JSON.parse(JSON.stringify(initialSuppliers));

  return (
    <div className="agri-container space-y-6">
      <SuppliersClient initialSuppliers={serializedSuppliers} />
    </div>
  );
}
