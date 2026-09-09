"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PriceRecItem {
  _id: string;
  productName: string;
  currentFarmerPrice: number;
  apmcModalBenchmarkPrice: number;
  recommendedMinPrice: number;
  recommendedMaxPrice: number;
  factors: {
    apmcModalPrice: number;
    distanceToHubKm?: number;
    gradeMultiplier?: number;
    supplyDeficitPercent?: number;
  };
  explanation: string;
  aiModel: string;
}

export default function FarmerPricingPage() {
  const [recommendations, setRecommendations] = useState<PriceRecItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await fetch("/api/farmer/insights");
        const json = await res.json();
        if (json.success && json.insights.recommendations) {
          setRecommendations(json.insights.recommendations);
        }
      } catch (err) {
        console.error("Error loading pricing insights:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPricing();
  }, []);

  const handleApplyPrice = (id: string, recommendedPrice: number) => {
    setAppliedId(id);
    setRecommendations((prev) =>
      prev.map((r) =>
        r._id === id ? { ...r, currentFarmerPrice: recommendedPrice } : r
      )
    );
    setTimeout(() => setAppliedId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Price Recommendation Advisor
          </h1>
          <Badge variant="secondary" className="bg-amber-100 text-amber-900 text-[10px] font-bold">
            Dynamic Mandi Benchmark
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time price corridors based on APMC spot modal rates, direct farm grade sorting, and transit distances
        </p>
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Analyzing APMC Mandi rates and market corridors...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec) => {
            const isApplied = appliedId === rec._id;
            const midPoint = Math.round(
              (rec.recommendedMinPrice + rec.recommendedMaxPrice) / 2
            );

            return (
              <div
                key={rec._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5 hover:shadow-xs transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Crop Pricing Analysis
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      {rec.productName}
                    </h2>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold text-emerald-800 bg-emerald-50 border-emerald-300">
                    Grade A Premium
                  </Badge>
                </div>

                {/* Rates Comparison Matrix */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  {/* Current Farmer Price */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Your Price
                    </span>
                    <span className="text-base font-extrabold text-slate-900 font-mono mt-1 block">
                      ₹{rec.currentFarmerPrice}
                      <span className="text-[10px] text-slate-500 font-normal">/kg</span>
                    </span>
                  </div>

                  {/* Local APMC Modal Price */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">
                      APMC Modal Rate
                    </span>
                    <span className="text-base font-extrabold text-slate-500 font-mono mt-1 block line-through">
                      ₹{rec.apmcModalBenchmarkPrice}
                      <span className="text-[10px] text-slate-400 font-normal">/kg</span>
                    </span>
                  </div>

                  {/* AI Recommended Corridor */}
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                    <span className="text-[10px] text-emerald-800 font-bold block">
                      AI Recommended
                    </span>
                    <span className="text-base font-extrabold text-emerald-800 font-mono mt-1 block">
                      ₹{rec.recommendedMinPrice} - ₹{rec.recommendedMaxPrice}
                    </span>
                  </div>
                </div>

                {/* Corridors breakdown */}
                <div className="p-3.5 rounded-xl bg-slate-50 text-xs space-y-2 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Local APMC Mandi Base:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{rec.factors.apmcModalPrice}/kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Grade Sorting Direct Multiplier:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      +{Math.round(((rec.factors.gradeMultiplier || 1.15) - 1) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Supply Deficit Factor:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      +{rec.factors.supplyDeficitPercent || 10}%
                    </span>
                  </div>
                </div>

                {/* Gemini Model Rationale */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                    <span>Gemini Market Rationale:</span>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    {rec.explanation}
                  </p>
                </div>

                {/* Apply Button */}
                <Button
                  size="sm"
                  onClick={() => handleApplyPrice(rec._id, midPoint)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold"
                >
                  {isApplied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      <span>Applied ₹{midPoint}/kg to Listing!</span>
                    </>
                  ) : (
                    <>
                      <Tag className="h-3.5 w-3.5 mr-1.5" />
                      <span>Apply Recommended ₹{midPoint}/kg to Produce</span>
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
