"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsProps {
  data: {
    overview: {
      totalProcuredTonnes: number;
      totalSpend: number;
      totalSavingsVsApmc: number;
      savingsPercentage: number;
      activeSuppliersCount: number;
    };
    monthlyProcurementTrend: Array<{
      month: string;
      volumeTonnes: number;
      spend: number;
      mandiSavings: number;
    }>;
    cropSpendBreakdown: Array<{
      name: string;
      tonnes: number;
      spend: number;
      avgPriceKg: number;
      apmcPriceKg: number;
    }>;
    supplierConcentration: Array<{
      name: string;
      sharePercentage: number;
      volumeTonnes: number;
      rating: number;
    }>;
    intermediaryEliminationSavings: {
      directProcurementSpend: number;
      traditionalApmcCost: number;
      middlemenCommissionsSaved: number;
      transportTransitDamageSaved: number;
      totalBenefitRupees: number;
      roiPercentage: number;
    };
  };
}

export function AnalyticsClient({ data }: AnalyticsProps) {
  const {
    overview,
    monthlyProcurementTrend,
    cropSpendBreakdown,
    intermediaryEliminationSavings,
  } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Procurement &amp; Savings Analytics</h1>
        <p className="text-xs text-slate-500">
          Audited metrics showing direct grower savings, volume trends, and Mandi price differentials
        </p>
      </div>

      {/* 4 Highlight Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Total Purchases</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overview.totalProcuredTonnes} <span className="text-xs font-semibold text-slate-500">Tons</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Horticulture produce volume</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Gross Procurement Spend</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(overview.totalSpend)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Direct to farm/FPO bank accounts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">APMC Net Savings</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(overview.totalSavingsVsApmc)}
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">+{overview.savingsPercentage}% direct sourcing gain</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Active FPO / Farmer Suppliers</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overview.activeSuppliersCount} <span className="text-xs font-semibold text-slate-500">Entities</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across 3 Maharashtra clusters</p>
        </div>
      </div>

      {/* Recharts Monthly Volume & Spend Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Procurement Spend vs Mandi Savings</h3>
              <p className="text-[11px] text-slate-500">Monthly breakdown in INR</p>
            </div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-300 text-[10px] font-bold">
              Direct Savings
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProcurementTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), ""]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", fontSize: "11px", border: "1px solid #e2e8f0" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="spend" name="Direct Spend (₹)" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mandiSavings" name="Mandi Savings (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Sourcing Volume Trend</h3>
              <p className="text-[11px] text-slate-500">Metric Tonnes of horticulture produce</p>
            </div>
            <Badge variant="outline" className="text-blue-700 border-blue-300 text-[10px] font-bold">
              Volume (Tonnes)
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyProcurementTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => [`${value} Tonnes`, "Volume"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", fontSize: "11px", border: "1px solid #e2e8f0" }}
                />
                <Area type="monotone" dataKey="volumeTonnes" name="Volume (Tons)" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#volumeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Average Price vs APMC Modal Rate per Crop */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Crop Average Procurement Price vs APMC Modal Rate</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Crop / Produce</th>
                <th className="px-4 py-3">Volume Procured</th>
                <th className="px-4 py-3">Direct Avg Price</th>
                <th className="px-4 py-3">APMC Modal Rate</th>
                <th className="px-4 py-3">Per-Kg Savings</th>
                <th className="px-4 py-3 text-right">Total Crop Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {cropSpendBreakdown.map((crop, idx) => {
                const diff = parseFloat((crop.apmcPriceKg - crop.avgPriceKg).toFixed(1));
                const totalCropSavings = Math.round(diff * crop.tonnes * 1000);

                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{crop.name}</td>
                    <td className="px-4 py-3 text-slate-600">{crop.tonnes} Tonnes</td>
                    <td className="px-4 py-3 font-bold text-slate-900">₹{crop.avgPriceKg}/kg</td>
                    <td className="px-4 py-3 text-slate-400 line-through">₹{crop.apmcPriceKg}/kg</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      ₹{diff}/kg ({Math.round((diff / crop.apmcPriceKg) * 100)}%)
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-800 text-right">
                      {formatCurrency(totalCropSavings)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intermediary Disintermediation Impact Summary */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-900">
          <Sparkles className="h-5 w-5 text-emerald-700" />
          <h3 className="font-bold text-base">Measurable Disintermediation Impact Breakdown</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl bg-white border border-emerald-100 p-4 shadow-2xs space-y-1">
            <span className="text-slate-500 font-medium">Middlemen Commissions Bypassed</span>
            <div className="text-lg font-black text-slate-900">
              {formatCurrency(intermediaryEliminationSavings.middlemenCommissionsSaved)}
            </div>
            <p className="text-[11px] text-slate-400">Standard 8-10% mandi arhatiya charge eliminated</p>
          </div>

          <div className="rounded-xl bg-white border border-emerald-100 p-4 shadow-2xs space-y-1">
            <span className="text-slate-500 font-medium">Transit Damage &amp; Spoilage Averted</span>
            <div className="text-lg font-black text-slate-900">
              {formatCurrency(intermediaryEliminationSavings.transportTransitDamageSaved)}
            </div>
            <p className="text-[11px] text-slate-400">Direct farm crate loading reduces handling loss by 6%</p>
          </div>

          <div className="rounded-xl bg-emerald-700 text-white p-4 shadow-2xs space-y-1">
            <span className="text-emerald-100 font-medium">Net Commercial Procurement Gain</span>
            <div className="text-xl font-black text-white">
              {formatCurrency(intermediaryEliminationSavings.totalBenefitRupees)}
            </div>
            <p className="text-[11px] text-emerald-200 font-semibold">
              +{intermediaryEliminationSavings.roiPercentage}% overall cost reduction
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
