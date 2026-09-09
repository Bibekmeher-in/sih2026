"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Layers,
  Truck,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { ErrorDisplay } from "@/components/ui/error-display";

interface FarmerStats {
  totalEarnings: number;
  totalSalesCount: number;
  activeOrdersCount: number;
  availableInventoryKg: number;
  pendingDeliveriesCount: number;
  directPremiumPercent: number;
  monthlyTrends: {
    month: string;
    directRevenue: number;
    apmcBenchmarkRevenue: number;
    ordersCount: number;
  }[];
  productPerformance: {
    name: string;
    revenue: number;
    quantitySold: number;
    stockRemaining: number;
  }[];
}

interface OrderItem {
  _id: string;
  orderNumber: string;
  buyerName: string;
  buyerType: string;
  productName: string;
  quantity: number;
  unit: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

export default function FarmerDashboardPage() {
  const [stats, setStats] = useState<FarmerStats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(false);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/farmer/stats"),
        fetch("/api/farmer/orders"),
      ]);
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (ordersData.success) setOrders(ordersData.orders.slice(0, 4));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus = "PROCESSING";
    if (currentStatus === "CONFIRMED") nextStatus = "PROCESSING";
    else if (currentStatus === "PROCESSING") nextStatus = "ASSIGNED_FOR_DELIVERY";
    else if (currentStatus === "ASSIGNED_FOR_DELIVERY") nextStatus = "IN_TRANSIT";
    else if (currentStatus === "IN_TRANSIT") nextStatus = "DELIVERED";

    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/farmer/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, orderStatus: nextStatus } : o))
        );
      }
    } catch (err) {
      console.error("Error updating order:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message="Failed to load dashboard data. Please check your connection."
        retry={loadData}
      />
    );
  }

  const s = stats || {
    totalEarnings: 112500,
    totalSalesCount: 45,
    activeOrdersCount: 3,
    availableInventoryKg: 4200,
    pendingDeliveriesCount: 1,
    directPremiumPercent: 28.4,
    monthlyTrends: [],
    productPerformance: [],
  };

  return (
    <div className="space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Producer Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time farm inventory, incoming orders, and direct Mandi price comparison
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-initial">
            <Link href="/farmer/pricing" className="flex items-center justify-center gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>AI Price Advisor</span>
            </Link>
          </Button>

          <Button asChild size="sm" className="flex-1 sm:flex-initial">
            <Link href="/farmer/products/new" className="flex items-center justify-center gap-1.5 text-xs">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>List Produce</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Earnings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Earnings</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 truncate">
            {formatCurrency(s.totalEarnings)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-700 font-bold truncate">
            <TrendingUp className="h-3 w-3 shrink-0" />
            <span>+28.4% direct vs APMC</span>
          </div>
        </div>

        {/* Total Sales Count */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Sales</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
            {s.totalSalesCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Completed farm-gate orders</p>
        </div>

        {/* Active Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Orders</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
            {s.activeOrdersCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Need sorting &amp; dispatch</p>
        </div>

        {/* Available Stock */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Inventory</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 truncate">
            {s.availableInventoryKg.toLocaleString("en-IN")} <span className="text-xs font-bold text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Ready for dispatch</p>
        </div>

        {/* Pending Deliveries */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>In-Transit</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
            {s.pendingDeliveriesCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Vehicles en route</p>
        </div>
      </div>

      {/* Recharts: Monthly Sales & APMC Spread */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Direct Sales Revenue vs APMC Benchmark
              </h2>
              <p className="text-xs text-slate-500">
                Monthly direct trade income compared to traditional Mandi modal rates
              </p>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs font-bold">
              +28% Farmer Gain
            </Badge>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDirect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorApmc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: unknown) => [formatCurrency(Number(value)), "Revenue"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area
                  type="monotone"
                  dataKey="directRevenue"
                  name="KisanDirect Revenue (Direct)"
                  stroke="#047857"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorDirect)"
                />
                <Area
                  type="monotone"
                  dataKey="apmcBenchmarkRevenue"
                  name="APMC Mandi Equivalent"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorApmc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Performance Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Crop Performance</h2>
            <p className="text-xs text-slate-500">Revenue contribution per produce lot</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={s.productPerformance}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#334155" }}
                  width={110}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatCurrency(Number(val)), "Revenue"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="revenue" fill="#047857" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders Action Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Incoming Orders</h2>
            <p className="text-xs text-slate-500">
              Orders requiring dispatch preparation and fulfillment
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/farmer/orders" className="flex items-center gap-1.5 text-xs">
              <span>View All Orders</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Buyer</th>
                <th className="py-3 px-4">Produce</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => {
                const isUpdating = updatingOrderId === order._id;
                return (
                  <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{order.buyerName}</div>
                      <Badge variant="outline" className="text-[10px] py-0 mt-0.5">
                        {order.buyerType === "BULK_BUYER" ? "Bulk Buyer" : "Retail Consumer"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {order.productName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {order.quantity} {order.unit}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          order.orderStatus === "DELIVERED"
                            ? "secondary"
                            : order.orderStatus === "CONFIRMED"
                            ? "default"
                            : "outline"
                        }
                        className={
                          order.orderStatus === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.orderStatus === "IN_TRANSIT"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }
                      >
                        {order.orderStatus.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {order.orderStatus === "DELIVERED" ? (
                        <div className="flex items-center justify-end gap-1 text-emerald-700 font-semibold text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Fulfilled</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() => handleAdvanceStatus(order._id, order.orderStatus)}
                          className="h-7 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 border-emerald-300"
                        >
                          {isUpdating ? (
                            <Clock className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <span>Advance</span>
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
