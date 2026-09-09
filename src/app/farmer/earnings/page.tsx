"use client";

import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface EarningsData {
  grossRevenue: number;
  realizedRevenue: number;
  escrowHeldRevenue: number;
  averageOrderValue: number;
  totalOrdersCount: number;
  monthlyTrends: {
    month: string;
    directRevenue: number;
    apmcBenchmarkRevenue: number;
    ordersCount: number;
  }[];
  topProducts: {
    name: string;
    revenue: number;
    quantitySold: number;
    stockRemaining: number;
  }[];
  mandiComparison: {
    directIncome: number;
    apmcIncome: number;
    netGain: number;
    gainPercentage: number;
  };
}

export default function FarmerEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEarnings() {
      try {
        const res = await fetch("/api/farmer/earnings");
        const json = await res.json();
        if (json.success) {
          setData(json.earnings);
        }
      } catch (err) {
        console.error("Error loading earnings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEarnings();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading financial analytics...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Earnings &amp; Financial Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Detailed breakdown of direct farm gate sales, Escrow security, and Mandi comparison gains
        </p>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Gross Direct Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(data.grossRevenue)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-700 font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>+{data.mandiComparison.gainPercentage}% over Mandi</span>
          </div>
        </div>

        {/* Realized Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Settled in Bank</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mt-2">
            {formatCurrency(data.realizedRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Paid directly via NEFT/UPI</p>
        </div>

        {/* Escrow Held */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Escrow Protected</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2">
            {formatCurrency(data.escrowHeldRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Releases on delivery acceptance</p>
        </div>

        {/* Average Order Value */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Average Order Value</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(data.averageOrderValue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across {data.totalOrdersCount} fulfilled orders</p>
        </div>
      </div>

      {/* Mandi vs Direct Comparison Banner */}
      <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-700 text-white text-[10px] uppercase font-bold">
                SIH Impact Verification
              </Badge>
              <span className="text-xs text-emerald-200 font-medium">Bypassing Middleman Cuts</span>
            </div>
            <h2 className="text-xl font-bold">
              You Have Earned <span className="text-emerald-300">+{formatCurrency(data.mandiComparison.netGain)}</span> More Than APMC
            </h2>
            <p className="text-xs text-emerald-100">
              By selling directly through KisanDirect, you avoided typical 8.5% APMC agent commissions, 4% loading deductions, and 15% wholesale buyer discounts.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-emerald-900/60 p-4 rounded-xl border border-emerald-700/50">
            <div>
              <span className="text-[11px] text-emerald-200 block">Direct Net Income:</span>
              <span className="text-xl font-extrabold font-mono text-white">
                {formatCurrency(data.mandiComparison.directIncome)}
              </span>
            </div>
            <div className="border-l border-emerald-700 pl-6">
              <span className="text-[11px] text-emerald-300 block">Net Surplus Gain:</span>
              <span className="text-xl font-extrabold font-mono text-emerald-300">
                +{data.mandiComparison.gainPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            6-Month Sales Trend &amp; Mandi Spread
          </h2>
          <p className="text-xs text-slate-500">
            Monthly gross direct sales (INR) compared to local Mandi modal equivalent
          </p>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="directEarnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#047857" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="apmcEarnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
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
                formatter={(val: unknown) => [formatCurrency(Number(val)), "Revenue"]}
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
                name="KisanDirect Direct Sales"
                stroke="#047857"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#directEarnGrad)"
              />
              <Area
                type="monotone"
                dataKey="apmcBenchmarkRevenue"
                name="APMC Mandi Equivalent"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#apmcEarnGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Top Revenue Contributing Produce</h2>
          <p className="text-xs text-slate-500">Cumulative sales across crops</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Produce Name</th>
                <th className="py-3 px-4">Quantity Sold</th>
                <th className="py-3 px-4">Stock Remaining</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.topProducts.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{p.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                    {p.quantitySold.toLocaleString("en-IN")} kg
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {p.stockRemaining.toLocaleString("en-IN")} kg
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 text-right font-mono text-sm">
                    {formatCurrency(p.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
