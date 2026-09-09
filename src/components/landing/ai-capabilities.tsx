"use client";

import React from "react";
import { Sparkles, LineChart, MessageSquareCode, ShieldCheck, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";

export function AICapabilitiesSection() {
  const { t } = useLanguage();

  const capabilities = [
    {
      icon: LineChart,
      title: "Predictive Demand Insights",
      description:
        "Forecasts localized consumption demand 7-14 days in advance using historical mandis data, seasonal festivals, and weather patterns. Helps farmers avoid glut and plan harvesting schedules.",
      badge: "Demand Forecasting",
    },
    {
      icon: Sparkles,
      title: "Fair Price Discovery Engine",
      description:
        "Combines deterministic mathematical models (historical modal prices, APMC benchmarks, transport distance) with Google Gemini AI to generate fair price recommendations with transparent explanations.",
      badge: "Dynamic Pricing",
    },
    {
      icon: MessageSquareCode,
      title: "Natural-Language Agritech Advisor",
      description:
        "Interactive Gemini-powered assistant providing contextual explanations on market trends, harvest timing, and storage recommendations directly to smallholders in accessible language.",
      badge: "Gemini Intelligence",
    },
  ];

  return (
    <section id="ai" className="py-16 sm:py-20 bg-white border-b border-slate-200">
      <div className="agri-container">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="amber" className="mb-3 px-3 py-1 font-semibold text-xs">
            {t("nav.aiEngine", "Google Gemini AI Engine")}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {t("landingSections.aiEngineTitle", "Google Gemini AI Engine & Decision Intelligence")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            {t(
              "landingSections.aiEngineSubtitle",
              "We separate business-critical calculations from AI explanations. Mathematical order totals and routes are deterministic; Gemini provides deep market insight and clear explanations."
            )}
          </p>
        </div>

        {/* 3 AI Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/60 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Verified Against Actual Mandi Records</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Philosophy Banner */}
        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-6 w-6 text-emerald-700 shrink-0" />
            <p className="text-xs sm:text-sm text-slate-700">
              <strong className="text-slate-900">Architecture Integrity:</strong> Payments, order totals, and route distances are calculated by deterministic code. Gemini never writes unvalidated data to the database.
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 text-xs bg-white">
            Zero Hallucination Guarantee
          </Badge>
        </div>
      </div>
    </section>
  );
}
