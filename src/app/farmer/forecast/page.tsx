"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Sparkles,
  Calendar,
  MapPin,
  CloudSun,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ForecastItem {
  _id: string;
  productName: string;
  location: { district: string; state: string };
  forecastPeriod: string;
  predictedDemandKg: number;
  confidenceScore: number;
  trendDirection: "RISING" | "STABLE" | "FALLING";
  factors: {
    seasonalImpact?: string;
    festivalSurge?: boolean;
    weatherCondition?: string;
    historicalAverageKg?: number;
  };
  aiModelVersion: string;
  explanation: string;
}

export default function FarmerForecastPage() {
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForecasts() {
      try {
        const res = await fetch("/api/farmer/insights");
        const json = await res.json();
        if (json.success && json.insights.forecasts) {
          setForecasts(json.insights.forecasts);
        }
      } catch (err) {
        console.error("Error loading forecasts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadForecasts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AI Crop Demand Forecasting
            </h1>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Gemini Agritech
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Predictive demand signals derived from consumer consumption, festive calendars, and APMC wholesale arrival patterns
          </p>
        </div>
      </div>

      {/* Forecast Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Generating AI demand forecasts...
        </div>
      ) : forecasts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
          No active crop forecasts found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forecasts.map((fc) => {
            const isRising = fc.trendDirection === "RISING";

            return (
              <div
                key={fc._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5 hover:shadow-xs transition-all"
              >
                {/* Header: Crop name & Trend */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Produce Forecast
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      {fc.productName}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                      <span>
                        {fc.location.district}, {fc.location.state}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={isRising ? "default" : "secondary"}
                    className={`text-xs font-bold px-3 py-1 ${
                      isRising
                        ? "bg-emerald-800 text-white"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                    <span>{fc.trendDirection} DEMAND</span>
                  </Badge>
                </div>

                {/* Key Metrics: Predicted Volume & Confidence */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Forecast Period
                    </span>
                    <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                      {fc.forecastPeriod}
                    </span>
                    <span className="text-xs text-emerald-700 font-bold block mt-1">
                      {fc.predictedDemandKg.toLocaleString("en-IN")} kg expected
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      AI Model Confidence
                    </span>
                    <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                      {Math.round(fc.confidenceScore * 100)}% Match
                    </span>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-emerald-700 h-1.5 rounded-full"
                        style={{ width: `${Math.round(fc.confidenceScore * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Drivers & Contributing Factors */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block">Market Signals &amp; Drivers:</span>
                  <div className="space-y-1.5">
                    {fc.factors.festivalSurge && (
                      <div className="flex items-center gap-2 text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <Flame className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Festival Procurement Surge: Expected +15-20% institutional volume uptick.</span>
                      </div>
                    )}
                    {fc.factors.seasonalImpact && (
                      <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                        <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{fc.factors.seasonalImpact}</span>
                      </div>
                    )}
                    {fc.factors.weatherCondition && (
                      <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                        <CloudSun className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>{fc.factors.weatherCondition}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gemini AI Synthesis */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                    <span>AI Action Recommendation:</span>
                  </div>
                  <p className="text-xs text-emerald-950 leading-relaxed">
                    {fc.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
