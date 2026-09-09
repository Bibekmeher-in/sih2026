import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getConsumerStats, getConsumerOrders } from "@/lib/consumer-service";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  TrendingDown,
  Truck,
  Heart,
  ArrowRight,
  Sparkles,
  Store,
  ChevronRight,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ConsumerDashboardPage() {
  const user = await requireRole([USER_ROLES.CONSUMER]);
  const stats = await getConsumerStats(user.id);
  const orders = await getConsumerOrders(user.id);

  const activeOrder = orders.find((o) =>
    ["CONFIRMED", "PROCESSING", "ASSIGNED_FOR_DELIVERY", "IN_TRANSIT"].includes(o.orderStatus)
  );

  // Fetch real featured products from DB
  let freshHarvests: { _id: string; name: string; variety?: string; qualityGrade?: string; price: number; unit: string; mandiBenchmarkPrice?: number; sellerName?: string; location?: { district?: string } }[] = [];
  try {
    await connectToDatabase();
    const dbProducts = await Product.find({ status: "AVAILABLE" })
      .sort({ harvestDate: -1 })
      .limit(4)
      .lean();
    freshHarvests = dbProducts.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      variety: p.variety,
      qualityGrade: p.qualityGrade,
      price: p.price,
      unit: p.unit,
      mandiBenchmarkPrice: p.mandiBenchmarkPrice,
      sellerName: p.sellerName,
      location: p.location,
    }));
  } catch {
    // DB offline — show empty state
  }

  return (
    <div className="agri-container space-y-6 sm:space-y-8">
      {/* Welcome & Farm Impact Hero */}
      <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
          <Sparkles className="w-80 h-80 text-emerald-300" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-200">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            <span>Direct Farm-to-Kitchen Supply Chain</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Namaste, {user.name}!
          </h1>

          <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
            By shopping directly on KISANOVA, you have saved approximately{" "}
            <span className="font-bold text-emerald-300">
              {formatCurrency(stats.totalSavings)}
            </span>{" "}
            versus supermarket retail markups, while channeling{" "}
            <span className="font-bold text-amber-300">
              {formatCurrency(stats.farmerPremiumContributed)}
            </span>{" "}
            straight into grower bank accounts with zero middleman deductions.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm gap-2">
                <Store className="h-4 w-4" />
                <span>Explore Today&apos;s Harvest</span>
              </Button>
            </Link>
            <Link href="/consumer/orders" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-900 font-bold border border-slate-200 rounded-xl text-xs sm:text-sm shadow-xs transition-colors gap-2">
                <PackageCheck className="h-4 w-4 text-emerald-700" />
                <span>View Past Deliveries</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Orders Placed</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {stats.totalOrders}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified farm-gate orders</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Direct Consumer Savings</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            {formatCurrency(stats.totalSavings)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">~22% vs supermarket markups</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Dispatches</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-2">
            {stats.activeDispatches}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">In transit via fleet cold-chain</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Farmer Direct Benefit</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-2">
            {formatCurrency(stats.farmerPremiumContributed)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Direct to grower bank accounts</p>
        </div>
      </div>

      {/* Live Order In-Transit Card (if any active order) */}
      {activeOrder && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-white to-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white font-bold text-[10px] uppercase">
                  Shipment In Transit
                </Badge>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {activeOrder.orderNumber}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Produce Dispatched by {activeOrder.sellerName}
              </h3>
              <p className="text-xs text-slate-600">
                Destination: <span className="font-semibold">{activeOrder.deliveryAddress?.district}, {activeOrder.deliveryAddress?.state}</span> • Total: <span className="font-bold text-emerald-800">{formatCurrency(activeOrder.total)}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/consumer/orders/${activeOrder._id}`}>
                <Button className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Live Vehicle Telemetry</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Fresh Harvest from Nearby Farms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Fresh Harvests from Verified Growers
            </h2>
            <p className="text-xs text-slate-500">
              Harvested within 24 hours in Nashik &amp; Pune horticulture belts
            </p>
          </div>
          <Link
            href="/marketplace"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All Listings</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {freshHarvests.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {freshHarvests.map((prod) => (
              <div
                key={prod._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <Badge variant="outline" className="text-emerald-700 border-emerald-300 font-semibold">
                      {prod.qualityGrade}
                    </Badge>
                    <span className="text-slate-500 font-medium">
                      {prod.location?.district}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{prod.name}</h4>
                    {prod.variety && (
                      <p className="text-[11px] text-slate-500">{prod.variety}</p>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-lg font-black text-emerald-700">
                      ₹{prod.price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      /{prod.unit}
                    </span>
                    {prod.mandiBenchmarkPrice && (
                      <span className="text-[10px] text-slate-400 line-through ml-auto">
                        Mandi: ₹{prod.mandiBenchmarkPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Seller: <span className="font-medium text-slate-700">{prod.sellerName || "Direct Grower"}</span>
                  </span>
                  <Link href={`/marketplace/${prod._id}`}>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
            <Store className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No listings yet</p>
            <p className="text-xs mt-1">Farmers will soon publish fresh harvest lots. Check back shortly.</p>
            <Link href="/marketplace" className="mt-3 inline-block">
              <Button size="sm" className="bg-emerald-700 text-white rounded-xl text-xs mt-2">Browse Marketplace</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Recent Orders Table Snapshot */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
          <Link
            href="/consumer/orders"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            All Orders &rarr;
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Produce Items</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.slice(0, 3).map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {o.sellerName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {o.items?.length || 1} produce lot(s)
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-800">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          o.orderStatus === "DELIVERED"
                            ? "default"
                            : o.orderStatus === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-[10px] font-bold"
                      >
                        {o.orderStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/consumer/orders/${o._id}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold text-emerald-700">
                          Track
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
