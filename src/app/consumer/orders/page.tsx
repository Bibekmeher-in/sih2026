import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getConsumerOrders } from "@/lib/consumer-service";
import { formatCurrency } from "@/lib/utils";
import {
  PackageCheck,
  Truck,
  ArrowRight,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ConsumerOrdersPage() {
  const user = await requireRole([USER_ROLES.CONSUMER]);
  const orders = await getConsumerOrders(user.id);

  return (
    <div className="agri-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Farm Orders</h1>
          <p className="text-xs text-slate-500">
            Track real-time harvests, logistics telemetry, and product receipts
          </p>
        </div>

        <Link href="/marketplace">
          <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-semibold gap-1.5">
            <Store className="h-3.5 w-3.5" />
            <span>Browse More Farm Produce</span>
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <PackageCheck className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not placed any orders yet. Visit our marketplace to buy direct from farmers.
          </p>
          <Link href="/marketplace">
            <Button className="bg-emerald-700 text-white rounded-xl text-xs mt-2">
              Explore Farm Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const isDelivered = o.orderStatus === "DELIVERED";
            const isCancelled = o.orderStatus === "CANCELLED";
            const isInTransit = ["CONFIRMED", "PROCESSING", "ASSIGNED_FOR_DELIVERY", "IN_TRANSIT"].includes(o.orderStatus);

            return (
              <div
                key={o._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {o.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isDelivered ? "default" : isCancelled ? "destructive" : "secondary"}
                      className={`text-[10px] font-bold uppercase ${
                        isInTransit ? "bg-blue-600 text-white" : ""
                      }`}
                    >
                      {o.orderStatus.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-emerald-800 border-emerald-300 font-mono">
                      {o.paymentStatus}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Seller & Destination */}
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Grower / Seller</span>
                    <div className="font-semibold text-slate-900">{o.sellerName}</div>
                    <p className="text-slate-500">
                      Destination: {o.deliveryAddress?.district}, {o.deliveryAddress?.state}
                    </p>
                  </div>

                  {/* Produce Items Preview */}
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Produce Lots</span>
                    <div className="font-medium text-slate-800">
                      {o.items?.[0]?.productName || "Fresh Produce"}
                      {o.items && o.items.length > 1 && (
                        <span className="text-slate-500"> +{o.items.length - 1} more item(s)</span>
                      )}
                    </div>
                    <p className="text-slate-500">
                      Payment Mode: <span className="font-semibold text-slate-700">{o.paymentMethod || "UPI"}</span>
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="flex flex-col sm:items-end justify-between gap-2">
                    <div className="sm:text-right">
                      <span className="text-slate-400 uppercase text-[10px] font-bold">Total Paid</span>
                      <div className="text-base font-black text-emerald-800">
                        {formatCurrency(o.total)}
                      </div>
                    </div>

                    <Link href={`/consumer/orders/${o._id}`}>
                      <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs gap-1.5">
                        <Truck className="h-3.5 w-3.5" />
                        <span>Track &amp; View Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
