import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getConsumerOrderById } from "@/lib/consumer-service";
import { OrderTrackerClient } from "./order-tracker-client";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConsumerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([USER_ROLES.CONSUMER]);
  const { id } = await params;

  const order = await getConsumerOrderById(user.id, id);
  if (!order) {
    notFound();
  }

  return (
    <div className="agri-container space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Link
          href="/consumer/orders"
          className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Orders</span>
        </Link>
      </div>

      <OrderTrackerClient initialOrder={order} />
    </div>
  );
}
