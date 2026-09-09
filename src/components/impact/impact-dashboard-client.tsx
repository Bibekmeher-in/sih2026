"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Truck,
  Award,
  Info,
  Scale,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { AgriculturalImpactReport, CommodityImpactItem } from "@/lib/impact-service";

interface ImpactDashboardClientProps {
  initialReport: AgriculturalImpactReport;
  isAdminView?: boolean;
}

export function ImpactDashboardClient({
  initialReport,
  isAdminView = false,
}: ImpactDashboardClientProps) {
  const [report] = useState<AgriculturalImpactReport>(initialReport);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityImpactItem>(
    report.commodityComparisonMatrix[0]
  );
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "COMMODITY_MATRIX" | "LOGISTICS" | "JUDGE_VIEW">(
    "OVERVIEW"
  );

  const f = report.farmerImpact;
  const c = report.consumerImpact;
  const s = report.supplyChainImpact;

  return (
    <div className="space-y-8">
      {/* Top Banner: SIH Mission & Agritech Impact Statement */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-900/70 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
              <Award className="h-3 w-3 text-amber-300" />
              <span>SIH 2026 Problem Statement Evaluation</span>
            </span>
            <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700">
              Disintermediation &amp; Fair Value Transfer
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Agricultural Impact &amp; Socioeconomic Realization Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1.5 leading-relaxed">
            Demonstrating how KISANOVA disintermediates traditional 6-tier APMC Mandi supply chains to deliver higher farm-gate income, lower household consumer food prices, and lower logistics spoilage.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Button
            onClick={() => setActiveTab("JUDGE_VIEW")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>SIH Judge Briefing</span>
          </Button>
          {!isAdminView ? (
            <Link href="/marketplace">
              <Button variant="outline" className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30 text-xs rounded-xl">
                <span>View Marketplace</span>
              </Button>
            </Link>
          ) : (
            <Link href="/admin/dashboard">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs rounded-xl">
                <span>Admin Console</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: "OVERVIEW", label: "Executive Impact Summary" },
          { id: "COMMODITY_MATRIX", label: "Transparent Price Realization Matrix" },
          { id: "LOGISTICS", label: "Supply Chain & Carbon Metrics" },
          { id: "JUDGE_VIEW", label: "SIH Problem Statement Alignment" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4 Core Hero Impact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Farmer Realization */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Farmer Realization
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              +{f.realizationImprovementPercent}%
            </div>
            <span className="text-xs font-semibold text-emerald-700 block mt-0.5">
              +₹{f.realizationImprovementInr}/kg over Mandi Modal
            </span>
            <p className="text-[11px] text-slate-500 mt-2">
              Direct farm-gate pricing bypasses middleman commissions &amp; unrecorded weighbridge losses.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-semibold">
            Cumulative Grower Gain: {formatCurrency(f.cumulativeIncrementalFarmerIncomeInr)}
          </div>
        </div>

        {/* Consumer Price Savings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Consumer Price Relief
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              -{c.averageSavingsPercent}%
            </div>
            <span className="text-xs font-semibold text-purple-700 block mt-0.5">
              ₹{c.averageSavingsInr}/kg saved vs Supermarket
            </span>
            <p className="text-[11px] text-slate-500 mt-2">
              Eliminating wholesale distribution markups provides direct household purchasing power relief.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-semibold">
            Total Household Savings: {formatCurrency(c.cumulativeConsumerSavingsInr)}
          </div>
        </div>

        {/* Intermediaries Eliminated */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Supply Chain Steps
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              5 of 6 Hops
            </div>
            <span className="text-xs font-semibold text-blue-700 block mt-0.5">
              Middleman Steps Bypassed
            </span>
            <p className="text-[11px] text-slate-500 mt-2">
              Eliminates village aggregators, APMC aadathiyas, secondary jobbers, and distributor markups.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-semibold">
            Turnaround: &lt;{c.turnaroundTimeHours} hrs Farm-to-Table
          </div>
        </div>

        {/* Logistics Optimization */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Route Efficiency
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Truck className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              -21.2%
            </div>
            <span className="text-xs font-semibold text-amber-700 block mt-0.5">
              {s.totalDistanceAvoidedKm} km Transit Avoided
            </span>
            <p className="text-[11px] text-slate-500 mt-2">
              Nearest-neighbor multi-farm collection cuts transit spoilage from 26% to &lt;3.5%.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-semibold">
            {s.co2EmissionsAvoidedKg} kg CO₂ Avoided
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & THE USER'S CONCRETE COMPARISON EXAMPLE */}
      {(activeTab === "OVERVIEW" || activeTab === "COMMODITY_MATRIX") && (
        <div className="space-y-6">
          {/* Detailed Side-by-Side Example Comparison Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-700" />
                  <span>The Economic Reality: Traditional Value Chain vs. KISANOVA</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Side-by-side transparent price breakdown demonstrating where the consumer rupee actually goes
                </p>
              </div>

              {/* Commodity Switcher Pills */}
              <div className="flex flex-wrap gap-1.5">
                {report.commodityComparisonMatrix.map((comm) => (
                  <button
                    key={comm.commodity}
                    onClick={() => setSelectedCommodity(comm)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedCommodity.commodity === comm.commodity
                        ? "bg-emerald-800 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {comm.commodity.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Side-by-Side Price Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Traditional Model */}
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive" className="text-xs">
                    Traditional APMC Multi-Tier System
                  </Badge>
                  <span className="text-xs font-semibold text-rose-700">6 Middleman Steps</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Consumer Retail Price:</span>
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{selectedCommodity.traditionalRetailPrice.toFixed(2)} / {selectedCommodity.unit}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Farmer Farm-Gate Realization:</span>
                    <span className="text-base font-extrabold text-rose-700">
                      ₹{selectedCommodity.traditionalFarmerRealization.toFixed(2)} / {selectedCommodity.unit}
                    </span>
                  </div>

                  {/* Visual Middleman Absorption Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Farmer Share: {((selectedCommodity.traditionalFarmerRealization / selectedCommodity.traditionalRetailPrice) * 100).toFixed(0)}%</span>
                      <span className="font-bold text-rose-700">
                        Middleman Spread: ₹{(selectedCommodity.traditionalRetailPrice - selectedCommodity.traditionalFarmerRealization).toFixed(2)} ({(100 - (selectedCommodity.traditionalFarmerRealization / selectedCommodity.traditionalRetailPrice) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        style={{
                          width: `${(selectedCommodity.traditionalFarmerRealization / selectedCommodity.traditionalRetailPrice) * 100}%`,
                        }}
                        className="bg-emerald-600 h-full"
                        title="Farmer Share"
                      />
                      <div className="bg-rose-500 h-full flex-1" title="Middlemen & Wastage" />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-rose-800 leading-relaxed bg-white/60 p-3 rounded-xl border border-rose-200/50">
                  ⚠️ Heavy losses occur in transit: 6–8% APMC cess, commission agents (aadathiyas), multiple loading/unloading stages, and 26% post-harvest spoilage.
                </p>
              </div>

              {/* KISANOVA Model */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-300 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-700 text-white text-xs">
                    KISANOVA Direct Agritech Model
                  </Badge>
                  <span className="text-xs font-bold text-emerald-800">1 Direct Consolidated Step</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Consumer Marketplace Price:</span>
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{selectedCommodity.KISANOVAConsumerPrice.toFixed(2)} / {selectedCommodity.unit}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Farmer Farm-Gate Realization:</span>
                    <span className="text-base font-extrabold text-emerald-700">
                      ₹{selectedCommodity.KISANOVAFarmerRealization.toFixed(2)} / {selectedCommodity.unit}
                    </span>
                  </div>

                  {/* Visual Direct Model Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span className="font-bold text-emerald-800">
                        Farmer Share: {((selectedCommodity.KISANOVAFarmerRealization / selectedCommodity.KISANOVAConsumerPrice) * 100).toFixed(0)}%
                      </span>
                      <span>
                        Freight &amp; Tech Fee: ₹{(selectedCommodity.KISANOVAConsumerPrice - selectedCommodity.KISANOVAFarmerRealization).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        style={{
                          width: `${(selectedCommodity.KISANOVAFarmerRealization / selectedCommodity.KISANOVAConsumerPrice) * 100}%`,
                        }}
                        className="bg-emerald-600 h-full"
                        title="Farmer Share"
                      />
                      <div className="bg-teal-500 h-full flex-1" title="Direct Logistics & Platform" />
                    </div>
                  </div>
                </div>

                {/* Net Socioeconomic Differential Highlight */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Farmer Improvement
                    </span>
                    <span className="text-sm font-black text-emerald-700">
                      +₹{selectedCommodity.farmerRealizationGain.toFixed(2)}/kg
                    </span>
                    <span className="text-[10px] text-emerald-600 block">
                      (+{selectedCommodity.farmerGainPercentage}%)
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Consumer Savings
                    </span>
                    <span className="text-sm font-black text-purple-700">
                      ₹{selectedCommodity.consumerSaving.toFixed(2)}/kg
                    </span>
                    <span className="text-[10px] text-purple-600 block">
                      (-{selectedCommodity.consumerSavingPercentage}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Commodity Price Benchmark Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Comprehensive Produce Benchmark Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cross-commodity economic spreads calculated against Agmarknet APMC modal mandi rates
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                5 Key Agri Commodities
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Commodity</th>
                    <th className="py-3 px-4">Traditional Retail</th>
                    <th className="py-3 px-4">Mandi Farmer Rate</th>
                    <th className="py-3 px-4">KISANOVA Consumer</th>
                    <th className="py-3 px-4">KISANOVA Farmer</th>
                    <th className="py-3 px-4 text-emerald-700 font-bold">Farmer Net Gain</th>
                    <th className="py-3 px-4 text-purple-700 font-bold">Consumer Saving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.commodityComparisonMatrix.map((comm) => (
                    <tr
                      key={comm.commodity}
                      className={`hover:bg-slate-50/60 transition-colors ${selectedCommodity.commodity === comm.commodity ? "bg-emerald-50/30 font-semibold" : ""
                        }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">{comm.commodity}</td>
                      <td className="py-3 px-4 text-slate-600">₹{comm.traditionalRetailPrice.toFixed(2)}/{comm.unit}</td>
                      <td className="py-3 px-4 text-rose-700">₹{comm.traditionalFarmerRealization.toFixed(2)}/{comm.unit}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">₹{comm.KISANOVAConsumerPrice.toFixed(2)}/{comm.unit}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">₹{comm.KISANOVAFarmerRealization.toFixed(2)}/{comm.unit}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        +₹{comm.farmerRealizationGain.toFixed(2)} (+{comm.farmerGainPercentage}%)
                      </td>
                      <td className="py-3 px-4 font-bold text-purple-700">
                        ₹{comm.consumerSaving.toFixed(2)} (-{comm.consumerSavingPercentage}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: LOGISTICS & CARBON METRICS */}
      {activeTab === "LOGISTICS" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-700" />
                <span>Supply Chain Inefficiency &amp; Logistics Waste Reduction</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic Nearest-Neighbor routing eliminates deadheading, fuel burns, and post-harvest produce decay
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block">
                  Transit Distance Saved
                </span>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  {s.totalDistanceAvoidedKm} km
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Average 77.4 km saved per multi-farm collection trip between agricultural hinterlands and terminal urban mandis.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block">
                  Freight Cost Saved
                </span>
                <div className="text-3xl font-black text-emerald-700 mt-1">
                  {formatCurrency(s.logisticsCostSavedInr)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Diesel expenditure saved from 2-opt route untangling and grouped Reefer transport dispatch.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block">
                  CO₂ Footprint Curtailed
                </span>
                <div className="text-3xl font-black text-teal-700 mt-1">
                  {s.co2EmissionsAvoidedKg} kg CO₂
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Avoided commercial vehicle exhaust emissions contributing to clean green agricultural corridors.
                </p>
              </div>
            </div>

            {/* Intermediary Disintermediation Visual Diagram */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">
                Value Chain Comparison: Middleman Elimination Architecture
              </span>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-rose-700 font-bold block mb-1">
                    1. Traditional Supply Chain (6 Sequential Hops — 70-95% Markup):
                  </span>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">1. Smallholder Farmer</Badge>
                    <span>→</span>
                    <span className="text-rose-700 line-through">2. Village Aggregator</span>
                    <span>→</span>
                    <span className="text-rose-700 line-through">3. APMC Commission Agent</span>
                    <span>→</span>
                    <span className="text-rose-700 line-through">4. Secondary Mandi Wholesaler</span>
                    <span>→</span>
                    <span className="text-rose-700 line-through">5. City Semi-Wholesaler</span>
                    <span>→</span>
                    <span className="text-rose-700 line-through">6. Neighborhood Retail Shop</span>
                    <span>→</span>
                    <Badge variant="outline">Consumer / Buyer</Badge>
                  </div>
                </div>

                <div>
                  <span className="text-emerald-700 font-bold block mb-1">
                    2. KISANOVA Streamlined Network (1 Direct Aggregated Hop — 12-16% Logistics Cost):
                  </span>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex flex-wrap items-center gap-2">
                    <Badge className="bg-emerald-700 text-white">Farmer / FPO Packhouse</Badge>
                    <span className="font-bold text-emerald-700">→</span>
                    <Badge className="bg-teal-700 text-white">KISANOVA Heuristic Grouped Logistics</Badge>
                    <span className="font-bold text-emerald-700">→</span>
                    <Badge className="bg-slate-900 text-white">Direct Consumer / Bulk Institutional Buyer</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SIH JUDGE BRIEFING & PROBLEM STATEMENT ALIGNMENT */}
      {activeTab === "JUDGE_VIEW" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs mb-2">
                Executive Defense Summary
              </Badge>
              <h2 className="text-xl font-bold text-slate-900">
                How KISANOVA Conclusively Solves the Stated Problem
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                A direct response to the national Smart India Hackathon problem statement across 4 core operational pillars
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Pillar 1 */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Better Farmer Prices (+24% to +33%)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Traditional farmers receive barely 50% of the retail price due to predatory 6-8% commission agent deductions, unrecorded weighbridge losses, and delayed credit payments. KISANOVA enables direct farm-gate lot listing, escrow-settled payments, and APMC benchmarked price corridors, securing ₹5-6/kg extra realization.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Lower Consumer Prices (15% to 20% Relief)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Urban consumers and wholesale institutional processors suffer from runaway food inflation caused by multiple middleman markups. By bypassing 5 intermediary tiers, consumers purchase fresh harvest lots at ₹5-6/kg below supermarket prices with guaranteed &lt;36 hour field-to-fork freshness.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Reduced Logistics Inefficiency (21.2% Distance Cut)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Individual smallholders cannot afford dedicated freight trucks, leading to high transit costs and 25-30% transit decay. KISANOVA uses a deterministic Nearest-Neighbor greedy heuristic with 2-opt edge untangling to group collections along highways, cutting transit distance by 77.4 km per trip and reducing decay to &lt;3.5%.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-amber-700 text-white flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Better Demand Planning (Grounded Gemini AI)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Farmers routinely suffer seasonal market gluts and panic harvest dumping because they have no visibility into urban demand. KISANOVA integrates Google Gemini 2.5 Flash with moving-average platform sales velocity to deliver 14-day demand projections and prevent distress selling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Econometric Simulation & Data Disclosure Alert */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex items-start gap-3.5 text-xs text-slate-600">
        <Info className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block">
            Statutory Data &amp; Methodology Disclosure
          </span>
          <p className="leading-relaxed">
            {report.disclosure.notice}
          </p>
          <p className="text-[11px] text-slate-400">
            Methodology: {report.disclosure.methodology}
          </p>
        </div>
      </div>
    </div>
  );
}
