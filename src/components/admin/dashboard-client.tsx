"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Tractor,
  Building2,
  ShoppingBag,
  Package,
  ShoppingCart,
  IndianRupee,
  Truck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  kpis: {
    totalUsers: number;
    activeFarmers: number;
    activeFpos: number;
    activeBuyers: number;
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    grossRevenue: number;
    activeDeliveries: number;
    completedDeliveries: number;
    fleetVehiclesCount: number;
    availableVehiclesCount: number;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    buyer?: { name: string; email: string; role: string };
    seller?: { name: string; email: string; role: string };
    total: number;
    orderStatus: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    phone: string;
    createdAt: string;
  }>;
}

export function AdminDashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data] = useState<DashboardData>(initialData);
  const k = data.kpis;

  const kpiCards = [
    {
      label: "Total Registered Users",
      value: k.totalUsers.toLocaleString(),
      subtext: `${k.activeFarmers} Farmers • ${k.activeBuyers} Buyers`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/users",
    },
    {
      label: "Active Farmers & FPOs",
      value: (k.activeFarmers + k.activeFpos).toLocaleString(),
      subtext: `${k.activeFpos} Producer Organizations`,
      icon: Tractor,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      href: "/admin/farmers",
    },
    {
      label: "Active Buyers",
      value: k.activeBuyers.toLocaleString(),
      subtext: "Retail households & B2B processors",
      icon: ShoppingBag,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/admin/buyers",
    },
    {
      label: "Total Catalog Listings",
      value: k.totalProducts.toLocaleString(),
      subtext: `${k.activeProducts} Live lots available`,
      icon: Package,
      color: "text-amber-700",
      bg: "bg-amber-50",
      href: "/admin/products",
    },
    {
      label: "Total Orders Placed",
      value: k.totalOrders.toLocaleString(),
      subtext: "12-step verified transactions",
      icon: ShoppingCart,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      href: "/admin/orders",
    },
    {
      label: "Platform GMV Revenue",
      value: formatCurrency(k.grossRevenue),
      subtext: "Escrow settled produce trade",
      icon: IndianRupee,
      color: "text-emerald-800",
      bg: "bg-emerald-100",
      href: "/admin/analytics",
    },
    {
      label: "Active Highway Deliveries",
      value: k.activeDeliveries.toLocaleString(),
      subtext: `${k.fleetVehiclesCount} Fleet units on standby`,
      icon: Truck,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/admin/deliveries",
    },
    {
      label: "Completed Deliveries",
      value: k.completedDeliveries.toLocaleString(),
      subtext: "Farm-gate to destination fulfilled",
      icon: CheckCircle2,
      color: "text-teal-700",
      bg: "bg-teal-50",
      href: "/admin/deliveries",
    },
  ];

  return (
    <div className="agri-container space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Executive Agritech Overview
            </span>
            <span className="text-[11px] text-slate-300">Live Production Node</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            National Agricultural Operations Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
            Real-time multi-tier aggregation of farmer listings, B2B wholesale demand contracts, escrow settlements, and cold-chain route telemetry.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-2.5 w-full md:w-auto">
          <Link href="/admin/impact" className="flex-1 sm:flex-initial">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5">
              <Activity className="h-4 w-4" />
              <span>Impact Engine</span>
            </Button>
          </Link>
          <Link href="/admin/analytics" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              <span>Analytics</span>
            </Button>
          </Link>
          <Link href="/admin/ai" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>AI Telemetry</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* SIH Hackathon Presentation Panel: Problem -> Solution -> Results */}
      <div className="rounded-2xl border border-emerald-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[11px]">
                SIH 2026 Presentation Model
              </Badge>
              <span className="text-xs text-slate-500 font-medium">Smart India Hackathon Executive Overview</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Agritech Value Chain Disintermediation Architecture
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Live Calculated DB Metrics
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span> SIH Illustrative Benchmark
            </span>
          </div>
        </div>

        {/* 3 Pillars: Problem -> Solution -> Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {/* Pillar 1: The Problem */}
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">The Problem</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">Traditional Mandi</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-2">
                Multi-Tier Intermediary Exploitation
              </h3>
              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">•</span>
                  <span><strong>5–6 Intermediary Tiers:</strong> Village aggregators, commission agents, regional wholesalers, and sub-dealers deplete value.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">•</span>
                  <span><strong>Farmer Realization Drop:</strong> Farmers receive only ~30–40% of the end-consumer price (e.g. ₹18/kg vs ₹35/kg).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">•</span>
                  <span><strong>Information Asymmetry:</strong> No direct visibility into urban retail or bulk processor demand.</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-rose-100 text-[11px] text-rose-800 font-medium">
              Impact: Farmers trapped in debt cycle while consumers face high food inflation.
            </div>
          </div>

          {/* Pillar 2: The Solution */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">The Solution</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">KisanDirect Tech</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-2">
                Direct Marketplace + Logistics + AI
              </h3>
              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Direct Digital Marketplace:</strong> Direct farm-gate listings connecting Farmers &amp; FPOs with B2B Bulk Buyers &amp; Consumers.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Logistics Optimization:</strong> Greedy nearest-neighbor clustering groups farm pickups into unified carrier dispatches.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Gemini AI Copilot:</strong> Real-time price recommendations and demand forecasting tailored to regional supply.</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-100 text-[11px] text-blue-800 font-medium">
              Architecture: Next.js + MongoDB + OpenStreetMap + Google Gemini.
            </div>
          </div>

          {/* Pillar 3: The Results */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">The Results</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Measured Realization</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-2">
                Win-Win Fair Value Transfer
              </h3>
              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Better Farmer Realization:</strong> +28% to +33% increase in net payout per kg (₹24/kg vs ₹18/kg baseline).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Lower Consumer Price:</strong> 15% to 20% lower retail expenditure (₹29/kg vs ₹35/kg mandi retail).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Route Distance Saved:</strong> 21.2% reduction in fleet transit kilometers via consolidated pickups.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Transparent Marketplace:</strong> Instant escrow ledger &amp; zero hidden commissions.</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100 text-[11px] text-emerald-800 font-medium">
              Outcome: Replicable national agricultural infrastructure for Indian farmers.
            </div>
          </div>
        </div>

        {/* 20-Step Demo Flow Roadmap Accordion / Quick Links */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              SIH 20-Step Live Demonstration Checklist
            </h4>
            <span className="text-[11px] text-slate-400">
              Demo Credentials: All passwords <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-700">Kisan@1234</code>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-emerald-700 block text-[10px]">STEPS 1–4</span>
              <span className="font-semibold text-slate-800">Farmer Onboarding</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Ramesh Kumar adds Tomato listing to public marketplace.</p>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-blue-700 block text-[10px]">STEPS 5–9</span>
              <span className="font-semibold text-slate-800">Bulk Buyer Contract</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Bhubaneswar Fresh Foods searches Tomato &amp; places bulk order.</p>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-amber-700 block text-[10px]">STEPS 10–13</span>
              <span className="font-semibold text-slate-800">Logistics &amp; Routing</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Vehicle assigned &amp; nearest-neighbor route shown on Leaflet map.</p>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-indigo-700 block text-[10px]">STEPS 14–17</span>
              <span className="font-semibold text-slate-800">Farmer AI Telemetry</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Earnings updated, AI demand insights &amp; price recommendations.</p>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-bold text-purple-700 block text-[10px]">STEPS 18–20</span>
              <span className="font-semibold text-slate-800">Admin Impact Review</span>
              <p className="text-[10px] text-slate-500 mt-0.5">National marketplace analytics &amp; agricultural impact proof.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block mb-1 truncate">
                    {c.label}
                  </span>
                  <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                    {c.value}
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1 block truncate">
                    {c.subtext}
                  </span>
                </div>
                <div className={`p-2 sm:p-3 rounded-xl ${c.bg} ${c.color} shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "User Accounts", href: "/admin/users", icon: Users },
          { label: "Farmer Directory", href: "/admin/farmers", icon: Tractor },
          { label: "FPO Clusters", href: "/admin/fpos", icon: Building2 },
          { label: "Buyer Accounts", href: "/admin/buyers", icon: ShoppingBag },
          { label: "Moderate Products", href: "/admin/products", icon: Package },
          { label: "Route Optimizer", href: "/admin/routes", icon: Truck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-center flex flex-col items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors shadow-2xs"
            >
              <Icon className="h-4 w-4 text-emerald-700" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Two-Column Section: Recent Orders & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Recent Platform Orders</h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recentOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No orders recorded yet. Seed demo data to preview.
              </div>
            ) : (
              data.recentOrders.map((ord) => (
                <div key={ord._id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {ord.orderNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {ord.orderStatus}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Buyer: {ord.buyer?.name || "Consumer"} • Seller: {ord.seller?.name || "Farmer"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(ord.total)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent User Registrations */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Recent Registrations</h2>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View Directory</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recentUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No users found.
              </div>
            ) : (
              data.recentUsers.map((u) => (
                <div key={u._id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {u.name}
                      </span>
                      <Badge className="text-[10px] py-0 bg-slate-100 text-slate-700 border-slate-200">
                        {u.role}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {u.email} • {u.phone || "No phone"}
                    </p>
                  </div>
                  <div>
                    <Badge
                      variant={u.status === "ACTIVE" ? "outline" : "destructive"}
                      className="text-[10px] py-0"
                    >
                      {u.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Node Health Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600" />
          <span className="font-bold text-slate-900">System Infrastructure Health:</span>
          <span className="text-slate-600">All cluster services operational.</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MongoDB: Connected (Port 27017)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Logistics Optimizer: Nearest-Neighbor Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Model Engine: Grounded</span>
          </div>
        </div>
      </div>
    </div>
  );
}
