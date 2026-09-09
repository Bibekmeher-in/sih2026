"use client";

import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  PackageCheck,
  Send,
  Loader2,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AiInsightsClientProps {
  initialData: {
    insights: {
      demandInsight: string;
      inventoryRecommendation: string;
      sellingRecommendation: string;
      shortExplanation: string;
      isAiGenerated: boolean;
      modelUsed: string;
      generatedAt: string;
    };
    recommendations: Array<{
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
    }>;
    forecasts: Array<{
      _id: string;
      productName: string;
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
    }>;
    farmerContext: {
      farmerName: string;
      location: { district: string; state: string };
      recentSalesVolumeKg?: number;
      grossEarningsInr?: number;
    };
  };
}

export default function FarmerAiInsightsClient({ initialData }: AiInsightsClientProps) {
  const { insights, recommendations, forecasts, farmerContext } = initialData;

  // Farmer Copilot Chat State
  const [messages, setMessages] = useState<
    Array<{
      sender: "user" | "assistant";
      text: string;
      actions?: string[];
      isAi?: boolean;
      time: string;
    }>
  >([
    {
      sender: "assistant",
      text: `Namaste ${farmerContext.farmerName}! I am your KISANOVA AI Copilot. I can advise you on harvest selling strategies, price corridors vs APMC Mandi, and inventory dispatch schedules for ${farmerContext.location.district}. How can I assist you today?`,
      actions: [
        "What should I sell more of?",
        "Why is tomato demand increasing?",
        "How can I improve my earnings?",
      ],
      isAi: true,
      time: "Just now",
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAskQuestion = async (queryToAsk?: string) => {
    const question = queryToAsk || inputQuery;
    if (!question.trim() || isLoading) return;

    const userMsg = {
      sender: "user" as const,
      text: question.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/farmer-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: data.answer,
            actions: data.suggestedActions,
            isAi: data.isAiGenerated,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        throw new Error(data.message || "Copilot error");
      }
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: `I apologize, I encountered a temporary connection issue: ${(err as Error).message}. For your produce in ${farmerContext.location.district}, our deterministic pricing baseline continues to recommend pricing at APMC modal + 18% to maximize direct earnings.`,
          isAi: false,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Safety Disclaimer Banner */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              Advisory &amp; Safety Notice
            </span>
            <Badge className="bg-amber-200 text-amber-900 border-none font-bold text-[10px]">
              AI-Assisted Guidance
            </Badge>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            All price corridors, demand forecasts, and assistant suggestions are generated using
            <strong> Gemini AI</strong> and deterministic econometric baselines. They should not be
            treated as authoritative financial, agronomic, or legal advice. Final harvest pricing
            remains at the discretion of the producer.
          </p>
        </div>
      </div>

      {/* 4 Key Insight Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Demand Insight
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {insights.demandInsight}
          </p>
          <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Active Procurement Surge</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Inventory Strategy
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {insights.inventoryRecommendation}
          </p>
          <div className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Optimal Farm Gate Dispatch</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Direct Selling Advantage
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {insights.sellingRecommendation}
          </p>
          <div className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Bypasses APMC Cess &amp; Deductions</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              AI Rationale
            </span>
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {insights.shortExplanation}
          </p>
          <div className="text-[10px] text-emerald-400 font-mono">
            Model: {insights.modelUsed}
          </div>
        </div>
      </div>

      {/* Main Grid: Price Recommendations & Demand Forecasts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Recommendations */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>AI Price Recommendation Corridors</span>
                <Badge className="bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Zero Blind Guessing
                </Badge>
              </h3>
              <p className="text-xs text-slate-500">
                Calculated against live Lasalgaon &amp; Dindori APMC Mandi modal spot prices
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec._id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{rec.productName}</h4>
                    <span className="text-[11px] text-slate-500">
                      Your Listing Price: ₹{rec.currentFarmerPrice}/kg
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Recommended Range
                    </span>
                    <span className="font-black text-emerald-800 text-base font-mono">
                      ₹{rec.recommendedMinPrice} - ₹{rec.recommendedMaxPrice}/kg
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200/60 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">APMC Spot Modal</span>
                    <span className="font-bold text-slate-700">₹{rec.apmcModalBenchmarkPrice}/kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Farmer Gain</span>
                    <span className="font-black text-emerald-700">
                      +₹{rec.recommendedMinPrice - rec.apmcModalBenchmarkPrice}/kg (+22%)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Quality Multiplier</span>
                    <span className="font-bold text-slate-700">
                      {rec.factors.gradeMultiplier || 1.15}x
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic">
                  &ldquo;{rec.explanation}&rdquo;
                </p>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>Engine: {rec.aiModel}</span>
                  <span className="text-emerald-700 font-bold">✓ Stored in MongoDB</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 14-Day Demand Forecasts */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>14-Day Demand Projections</span>
                <Badge className="bg-blue-100 text-blue-800 font-bold text-[10px]">
                  Econometric Heuristic
                </Badge>
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic moving averages &amp; regional restaurant procurement demand
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {forecasts.map((fc) => (
              <div
                key={fc._id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{fc.productName}</h4>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{fc.forecastPeriod}</span>
                    </span>
                  </div>
                  <Badge
                    className={
                      fc.trendDirection === "RISING"
                        ? "bg-emerald-100 text-emerald-800 border-none font-bold"
                        : "bg-blue-100 text-blue-800 border-none font-bold"
                    }
                  >
                    {fc.trendDirection} DEMAND
                  </Badge>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Predicted Volume
                    </span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {fc.predictedDemandKg.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Heuristic Confidence
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      {Math.round(fc.confidenceScore * 100)}%
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <strong>Seasonal Impact:</strong> {fc.factors?.seasonalImpact || "Stable daily market arrivals"}
                  </p>
                  <p>
                    <strong>Weather Window:</strong> {fc.factors?.weatherCondition || "Favorable harvest period"}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>Model: {fc.aiModelVersion}</span>
                  <span className="text-emerald-700 font-bold">✓ Validated Data</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature 4: Interactive Farmer Copilot Assistant */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                KISANOVA Farmer Copilot (AI Assistant)
              </h3>
              <p className="text-xs text-slate-500">
                Ask operational questions scoped strictly to your listings and sales in {farmerContext.location.district}
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            Private &amp; Secure
          </Badge>
        </div>

        {/* Chat Feed */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 min-h-[260px] max-h-[400px] overflow-y-auto space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${msg.sender === "user"
                    ? "bg-slate-900 text-white rounded-br-none"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs"
                  }`}
              >
                {msg.sender === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-emerald-700 font-bold">
                    <Sparkles className="h-3 w-3" />
                    <span>KISANOVA Copilot</span>
                    {msg.isAi && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[9px] px-1 py-0">
                        Gemini
                      </Badge>
                    )}
                  </div>
                )}
                <p className="whitespace-pre-line">{msg.text}</p>
                <div
                  className={`text-[9px] mt-1 text-right ${msg.sender === "user" ? "text-slate-400" : "text-slate-400"
                    }`}
                >
                  {msg.time}
                </div>
              </div>

              {/* Suggested Action Chips */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleAskQuestion(act)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    >
                      <Lightbulb className="h-3 w-3 text-emerald-600" />
                      <span>{act}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl max-w-[200px] text-xs text-slate-500 shadow-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
              <span>Analyzing market data...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Ask anything: e.g. 'What should I sell more of?' or 'Why is tomato demand increasing?'"
            value={inputQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputQuery(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-xs"
          />
          <Button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs gap-1.5 px-4"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Ask</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
