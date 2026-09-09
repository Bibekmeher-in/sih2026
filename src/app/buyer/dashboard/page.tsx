import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getBuyerStats, getBuyerOrders, getBulkRequirements } from "@/lib/buyer-service";
import { formatCurrency } from "@/lib/utils";
import {
  Scale,
  CreditCard,
  TrendingDown,
  PackageCheck,
  FileSpreadsheet,
  Truck,
  ArrowRight,
  Plus,
  Users,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function BuyerDashboardPage() {
  const user = await requireRole([USER_ROLES.BULK_BUYER]);
  const stats = await getBuyerStats(user.id);
  const orders = await getBuyerOrders(user.id);
  const requirements = await getBulkRequirements(user.id);

  const activeOrder = orders.find((o) =>
    ["CONFIRMED", "PROCESSING", "ASSIGNED_FOR_DELIVERY", "IN_TRANSIT"].includes(o.orderStatus)
  );

  return (
    <div className="agri-container space-y-6 sm:space-y-8">
      {/* Enterprise Procurement Hero Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Scale className="h-3.5 w-3.5" />
            <span>Commercial Wholesale Sourcing Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {user.name}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Direct farmer/FPO procurement portal. You have sourced{" "}
            <span className="font-bold text-white">{stats.totalProcuredTonnes} Metric Tonnes</span>{" "}
            of horticulture produce directly from Maharashtra farm gates, realizing{" "}
            <span className="font-bold text-emerald-400">
              {formatCurrency(stats.totalSavingsVsApmc)} ({stats.savingsPercentage}% savings)
            </span>{" "}
            over traditional APMC middleman commissions.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/buyer/requirements">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm gap-2 shadow-xs">
                <Plus className="h-4 w-4" />
                <span>Post Bulk Requirement (RFQ)</span>
              </Button>
            </Link>
            <Link href="/buyer/suppliers">
              <Button className="bg-white hover:bg-slate-100 text-slate-900 font-bold border border-slate-200 rounded-xl text-xs sm:text-sm shadow-xs transition-colors gap-2">
                <Users className="h-4 w-4 text-emerald-700" />
                <span>Discover Verified FPOs</span>
              </Button>
            </Link>
            <Link href="/buyer/marketplace">
              <Button className="bg-white hover:bg-slate-100 text-slate-900 font-bold border border-slate-200 rounded-xl text-xs sm:text-sm shadow-xs transition-colors gap-2">
                <Store className="h-4 w-4 text-emerald-700" />
                <span>Wholesale Lots Catalog</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Volume Sourced</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {stats.totalProcuredTonnes} <span className="text-xs font-semibold text-slate-500">Tons</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Horticulture produce</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Spend</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(stats.totalSpend)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Direct to farm accounts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>APMC Savings</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            {formatCurrency(stats.totalSavingsVsApmc)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">+{stats.savingsPercentage}% vs APMC commission</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Orders</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-2">
            {stats.activePurchaseOrders}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">In processing &amp; transit</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active RFQs</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-2">
            {stats.openRequirementsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Open reverse auctions</p>
        </div>
      </div>

      {/* Active In-Transit Shipment Telemetry Card */}
      {activeOrder && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-white to-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white font-bold text-[10px] uppercase">
                  Wholesale Reefer In Transit
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {activeOrder.orderNumber}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {activeOrder.quantity} {activeOrder.unit} {activeOrder.productName}
              </h3>
              <p className="text-xs text-slate-600">
                Supplier: <span className="font-semibold text-slate-800">{activeOrder.sellerName}</span> • Carrier: <span className="font-semibold text-slate-800">{activeOrder.carrierVehicle}</span> • ETA: <span className="font-semibold text-blue-700">{activeOrder.eta}</span>
              </p>
            </div>

            <Link href="/buyer/orders">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold gap-1.5 self-start sm:self-auto">
                <Truck className="h-3.5 w-3.5" />
                <span>View Dispatch Status</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Active Bulk RFQs Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Open Bulk Requirements (RFQs)</h2>
            <p className="text-xs text-slate-500">
              Matched with registered Farmers &amp; FPOs using deterministic scoring
            </p>
          </div>
          <Link
            href="/buyer/requirements"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Manage All RFQs ({requirements.length})</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requirements.map((r) => (
            <div
              key={r._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <Badge
                  variant={r.status === "MATCHED" ? "default" : "secondary"}
                  className={`text-[10px] font-bold ${
                    r.status === "MATCHED" ? "bg-emerald-700 text-white" : ""
                  }`}
                >
                  {r.status} ({r.matchedSuppliers?.length || 0} Matches)
                </Badge>
                <span className="text-xs font-medium text-slate-500">
                  Needed by: {r.requiredDate}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base">{r.productName}</h4>
                <p className="text-xs text-slate-500">
                  Required: <span className="font-bold text-slate-800">{r.requiredQuantity} {r.unit}</span> @ Target: <span className="font-bold text-emerald-700">₹{r.targetPrice}/{r.unit === "ton" ? "kg" : r.unit}</span>
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1 border border-slate-100">
                <div className="font-semibold text-slate-700">Top Matched Supplier:</div>
                {r.matchedSuppliers && r.matchedSuppliers.length > 0 ? (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{r.matchedSuppliers[0].sellerName}</span>
                    <Badge variant="outline" className="text-emerald-700 border-emerald-300 font-bold">
                      {r.matchedSuppliers[0].matchScore}% Match
                    </Badge>
                  </div>
                ) : (
                  <span className="text-slate-400">Scanning registered growers...</span>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Link href="/buyer/requirements">
                  <Button size="sm" variant="outline" className="rounded-xl text-xs border-slate-200">
                    Review Matches &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
