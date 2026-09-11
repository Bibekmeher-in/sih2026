import React from "react";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getBuyerOrders } from "@/lib/buyer-service";
import { BuyerOrdersClient } from "./buyer-orders-client";

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage() {
  const user = await requireRole([USER_ROLES.BULK_BUYER]);
  const orders = await getBuyerOrders(user.id);

  return <BuyerOrdersClient initialOrders={orders} />;
}
