import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getBuyerOrders } from "@/lib/buyer-service";
import { formatCurrency } from "@/lib/utils";
import {
  Truck,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage() {
  const user = await requireRole([USER_ROLES.BULK_BUYER]);
  const orders = await getBuyerOrders(user.id);

  return (
    <div className="agri-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Wholesale Purchase Orders</h1>
          <p className="text-xs text-slate-500">
            Monitor bulk contracts, cold-chain transport logistics, and escrow disbursement
          </p>
        </div>

        <Link href="/buyer/requirements">
          <Button variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-semibold gap-1.5 self-start sm:self-auto">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Post New Sourcing RFQ</span>
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {orders.map((o) => {
          const isDelivered = o.orderStatus === "DELIVERED";
          const isProcessing = o.orderStatus === "PROCESSING" || o.orderStatus === "IN_TRANSIT";

          return (
            <div
              key={o._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {o.orderNumber}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">
                    Dispatched {o.dispatchDate}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={isDelivered ? "default" : "secondary"}
                    className={`text-[10px] font-bold uppercase ${
                      isProcessing ? "bg-blue-600 text-white" : ""
                    }`}
                  >
                    {o.orderStatus}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-emerald-800 border-emerald-300 font-mono">
                    {o.paymentStatus}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                {/* Produce & Quantity */}
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Wholesale Lot</span>
                  <div className="font-bold text-slate-900">{o.productName}</div>
                  <p className="text-slate-600 font-semibold">
                    Volume: {o.quantity} {o.unit}
                  </p>
                </div>

                {/* Supplier Information */}
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Seller Organization</span>
                  <div className="font-semibold text-slate-900">{o.sellerName}</div>
                  <Badge variant="outline" className="text-[10px] text-slate-600">
                    {o.sellerType}
                  </Badge>
                </div>

                {/* Carrier Logistics */}
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Logistics Carrier</span>
                  <div className="font-semibold text-slate-900 flex items-center gap-1">
                    <Truck className="h-3 w-3 text-slate-500" />
                    <span>{o.carrierVehicle}</span>
                  </div>
                  <p className="text-slate-500">
                    Driver: {o.driverName} ({o.driverPhone})
                  </p>
                </div>

                {/* Amount & Settlement */}
                <div className="space-y-1 md:text-right">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Contract Total</span>
                  <div className="text-base font-black text-slate-900">
                    {formatCurrency(o.total)}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Destination: {o.deliveryHub}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
