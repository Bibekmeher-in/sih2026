"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Tag,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  Loader2,
  Package,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AiData {
  summary: {
    totalForecasts: number;
    totalPriceRecommendations: number;
    activeAiModel: string;
    promptGuardStatus: string;
    apiHealth: string;
  };
  trendDistribution: {
    RISING: number;
    STABLE: number;
    FALLING: number;
  };
  topForecastedProducts: Array<{
    name: string;
    count: number;
    avgDemandKg: number;
    avgConfidence: string;
  }>;
  recentForecasts: Array<{
    _id: string;
    productName: string;
    predictedDemandKg: number;
    trendDirection: string;
    confidenceScore: number;
    forecastPeriod: string;
    aiModelVersion: string;
    createdAt: string;
  }>;
  recentPriceRecs: Array<{
    _id: string;
    productName: string;
    currentFarmerPrice: number;
    apmcModalBenchmarkPrice: number;
    recommendedMinPrice: number;
    recommendedMaxPrice: number;
    aiModel: string;
    createdAt: string;
  }>;
}

export function AdminAiClient() {
  const [data, setData] = useState<AiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAiData() {
      try {
        const res = await fetch("/api/admin/ai");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load AI data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAiData();
  }, []);

  if (loading || !data) {
    return (
      <div className="agri-container py-16 text-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-700" />
        <p className="text-sm font-medium">Aggregating AI Agritech telemetry...</p>
      </div>
    );
  }

  const s = data.summary;
  const t = data.trendDistribution;
  const totalTrends = (t.RISING + t.STABLE + t.FALLING) || 1;
  const risingPct = Math.round((t.RISING / totalTrends) * 100);
  const stablePct = Math.round((t.STABLE / totalTrends) * 100);
  const fallingPct = Math.round((t.FALLING / totalTrends) * 100);

  return (
    <div className="agri-container space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>Google Gemini 2.5 Flash + Deterministic Heuristics</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            AI Agronomic &amp; Econometric Intelligence Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
            Platform monitoring for seasonal demand projections, econometric price corridor calculations, PromptGuard sanitization, and model reliability.
          </p>
        </div>

        <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs shrink-0 text-right">
          <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">
            AI Engine Telemetry Status
          </span>
          <div className="text-xl font-bold text-white flex items-center justify-end gap-2 mt-1">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{s.apiHealth}</span>
          </div>
          <span className="text-[10px] text-slate-300 block mt-0.5">
            Engine: {s.activeAiModel}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Total Demand Forecasts
          </span>
          <div className="text-2xl font-black text-slate-900">
            {s.totalForecasts.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Multi-week regional consumption projections
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Price Corridor Analyses
          </span>
          <div className="text-2xl font-black text-slate-900">
            {s.totalPriceRecommendations.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            APMC modal benchmark calibrated corridors
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            PromptGuard Defense
          </span>
          <div className="text-lg font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
            <ShieldCheck className="h-5 w-5" />
            <span>Capped &amp; Sanitized</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Max 8,000 chars per model execution
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Execution Circuit Breaker
          </span>
          <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5 mt-1">
            <Cpu className="h-5 w-5 text-indigo-600" />
            <span>12s Timeout Bound</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Zero stalling with deterministic fallback
          </span>
        </div>
      </div>

      {/* Demand Trend Distribution & Most Forecasted Commodities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demand Trend Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-700" />
              <span>National Demand Trend Distribution</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Categorization of forecasted horticultural and agronomic commodities by 14-day procurement momentum
            </p>

            <div className="space-y-4">
              {/* Rising */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Rising Demand ({t.RISING})</span>
                  </span>
                  <span>{risingPct}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${risingPct}%` }} className="h-full bg-emerald-600 rounded-full" />
                </div>
              </div>

              {/* Stable */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span className="flex items-center gap-1 text-blue-700">
                    <Minus className="h-3.5 w-3.5" />
                    <span>Stable Demand ({t.STABLE})</span>
                  </span>
                  <span>{stablePct}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${stablePct}%` }} className="h-full bg-blue-600 rounded-full" />
                </div>
              </div>

              {/* Falling */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span className="flex items-center gap-1 text-rose-700">
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span>Falling Demand ({t.FALLING})</span>
                  </span>
                  <span>{fallingPct}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${fallingPct}%` }} className="h-full bg-rose-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>All trend indicators explicitly disclosed as statistical heuristics to prevent unvalidated ML claims.</span>
          </div>
        </div>

        {/* Top Forecasted Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-700" />
              <span>Most Forecasted Commodities</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Produce lots with highest volume inquiries from urban consumers and wholesale processors
            </p>

            <div className="space-y-3">
              {data.topForecastedProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No forecasts generated yet. Seed or run AI hub to generate.
                </div>
              ) : (
                data.topForecastedProducts.map((p) => (
                  <div key={p.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{p.name}</span>
                      <span className="text-[10px] text-slate-400 block">
                        Forecasted in {p.count} platform run(s)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">
                        {p.avgDemandKg.toLocaleString()} kg
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 block mt-0.5">
                        Conf: {(parseFloat(p.avgConfidence) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-amber-600" />
            <span>High wholesale volume concentration in onion, tomato, and staple pulse corridors.</span>
          </div>
        </div>
      </div>

      {/* Recent AI Audit Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Recent Price Recommendation Corridors (APMC Mandi Grounded)
            </h3>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Audited Engine Output
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Current Asking Price</th>
                <th className="py-3 px-4">APMC Mandi Modal</th>
                <th className="py-3 px-4">Recommended Direct Corridor</th>
                <th className="py-3 px-4">Engine Model</th>
                <th className="py-3 px-4">Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentPriceRecs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No price recommendations stored yet.
                  </td>
                </tr>
              ) : (
                data.recentPriceRecs.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{r.productName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">₹{r.currentFarmerPrice}/kg</td>
                    <td className="py-3 px-4 text-slate-600">₹{r.apmcModalBenchmarkPrice}/kg</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-700">
                        ₹{r.recommendedMinPrice} - ₹{r.recommendedMaxPrice}/kg
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="text-[10px] bg-slate-100 text-slate-700 border-slate-200">
                        {r.aiModel}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
