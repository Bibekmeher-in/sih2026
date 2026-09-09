"use client";

import React from "react";
import { ClipboardList, Cpu, ShoppingBag, Truck, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";

export function HowItWorksSection() {
  const { t } = useLanguage();

  const steps = [
    {
      step: "01",
      icon: ClipboardList,
      title: t("landing.howStep1Title", "Produce Listing & Grading"),
      description: t(
        "landing.howStep1Desc",
        "Farmers list verified produce lots directly with harvest dates and quality grades."
      ),
      meta: "No registration fee or listing deduction",
    },
    {
      step: "02",
      icon: Cpu,
      title: t("landing.howStep2Title", "AI-Assisted Price Discovery"),
      description: t(
        "landing.howStep2Desc",
        "Transparent discovery powered by real-time APMC Mandi benchmarks and regional demand."
      ),
      meta: "Deterministic math + Gemini insights",
    },
    {
      step: "03",
      icon: ShoppingBag,
      title: t("landing.howStep3Title", "Direct Buyer Contracting"),
      description: t(
        "landing.howStep3Desc",
        "Wholesale processors, retail grocers, and families discover local farm-gate lots."
      ),
      meta: "Zero middlemen or commission agents",
    },
    {
      step: "04",
      icon: Truck,
      title: t("landing.howStep4Title", "Optimized Route Delivery"),
      description: t(
        "landing.howStep4Desc",
        "Our nearest-neighbor engine optimizes multi-stop pickups into unified routes."
      ),
      meta: "<24 hr turnaround for perishables",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-slate-50/50 border-b border-slate-200">
      <div className="agri-container">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="secondary" className="mb-3 px-3 py-1 font-semibold text-xs">
            {t("nav.howItWorks", "End-to-End Workflow")}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {t("landingSections.howTitle", "How KisanDirect Works")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            {t(
              "landingSections.howSubtitle",
              "A transparent, four-stage digital highway connecting Indian agriculture directly to urban and commercial consumption centers."
            )}
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative flex flex-col justify-between p-6 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                      STEP {item.step}
                    </span>
                    <div className="h-10 w-10 rounded-lg bg-emerald-100/60 text-emerald-800 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>{item.meta}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
