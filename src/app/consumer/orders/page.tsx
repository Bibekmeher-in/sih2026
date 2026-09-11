import React from "react";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getConsumerOrders } from "@/lib/consumer-service";
import { ConsumerOrdersClient } from "./orders-client";

export const dynamic = "force-dynamic";

export default async function ConsumerOrdersPage() {
  const user = await requireRole([USER_ROLES.CONSUMER]);
  const orders = await getConsumerOrders(user.id);

  return <ConsumerOrdersClient initialOrders={orders} />;
}
