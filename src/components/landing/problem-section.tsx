"use client";

import React from "react";
import { AlertTriangle, TrendingDown, Clock, PackageX, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";

export function ProblemSection() {
  const { t } = useLanguage();

  const problems = [
    {
      icon: TrendingDown,
      title: "Exploitative Middlemen Margins",
      description:
        "Traditional supply chains involve 4-6 intermediaries (dalals, primary aggregators, APMC commission agents, secondary wholesalers). Farmers only receive 25-35% of the final consumer price.",
      impact: "Farmer earns ₹12/kg while consumer pays ₹45/kg for tomatoes.",
    },
    {
      icon: AlertTriangle,
      title: "Asymmetric & Opaque Price Discovery",
      description:
        "Smallholders lack real-time mandi intelligence and historical seasonal price trends, forcing them into distress sales at local village gates before perishable harvests rot.",
      impact: "Zero bargaining power during peak harvesting flushes.",
    },
    {
      icon: PackageX,
      title: "20-30% Post-Harvest Wastage",
      description:
        "Lack of direct farm-gate logistics and multi-hop transport exposes perishables to excessive handling, sun exposure, and delays, causing massive spoilage.",
      impact: "Over ₹92,000 Crore worth of agricultural produce wasted annually in India.",
    },
    {
      icon: Clock,
      title: "Procurement Headaches for Bulk Buyers",
      description:
        "Retail chains, food processors, and hotels suffer from volatile daily mandi spot rates, unreliable delivery schedules, and non-standardized produce grades.",
      impact: "Inconsistent supplies and inflated procurement overheads.",
    },
  ];

  return (
    <section id="problem" className="py-16 sm:py-20 bg-white border-b border-slate-200">
      <div className="agri-container">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="destructive" className="mb-3 px-3 py-1 font-semibold text-xs">
            {t("landingSections.problemCrisis", "The Agricultural Supply Chain Crisis")}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {t("landingSections.problemTitle", "Why India's Agricultural Supply Chain is Broken")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            {t(
              "landingSections.problemSubtitle",
              "Despite feeding over 1.4 billion people, farmers face distress prices while consumers and bulk buyers pay inflated retail costs due to structural bottlenecks."
            )}
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                      <span>Impact:</span>
                      <span>{item.impact}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Callout */}
        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-800">
                The KISANOVA Solution
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                {t(
                  "landingSections.solutionBanner",
                  "Direct Farm-Gate Matching + Intelligent Logistics"
                )}
              </h3>
              <p className="text-sm text-slate-600 max-w-2xl">
                {t(
                  "landingSections.solutionBannerDesc",
                  "By bypassing predatory commission agents and providing AI-backed price benchmarks, KISANOVA transfers value back to the food producers and end buyers."
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white px-3 py-2 rounded-lg border border-emerald-200 shadow-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{t("common.active", "Fair Farm Gate Price")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white px-3 py-2 rounded-lg border border-emerald-200 shadow-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{t("nav.logistics", "Direct Route Logistics")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
