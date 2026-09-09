"use client";

import React from "react";
import { TrendingUp, IndianRupee, Scale, Shield, CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";

export function FarmerBenefitsSection() {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: TrendingUp,
      title: "28% to 35% Higher Net Realization",
      desc: "Retain the 15-25% commission and arbitrary mandi cuts that agents previously took for themselves.",
    },
    {
      icon: IndianRupee,
      title: "Direct Digital Payouts",
      desc: "No delayed credits, no bad debts, and no predatory lending. Direct bank settlement upon delivery verification.",
    },
    {
      icon: Scale,
      title: "Certified Digital Weight & Grading",
      desc: "Eliminates illegal weighbridge deductions and arbitrary quality downgrade penalties common in traditional mandis.",
    },
    {
      icon: Shield,
      title: "Zero Distress Selling",
      desc: "AI forecasts demand pockets in nearby urban centers, connecting you with verified buyers before harvests spoil.",
    },
    {
      icon: CalendarCheck,
      title: "Farm-Gate Aggregated Pickup",
      desc: "KISANOVA logistics pick up produce right from your farm or village collection center, saving transport hassle.",
    },
    {
      icon: TrendingUp,
      title: "FPO Scale & Collective Bargaining",
      desc: "FPOs can pool hundreds of smallholder harvests into commercial metric ton lots to command premium enterprise prices.",
    },
  ];

  return (
    <section id="farmers" className="py-16 sm:py-20 bg-white border-b border-slate-200">
      <div className="agri-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Context & Overview */}
          <div className="lg:col-span-5 space-y-5">
            <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs bg-emerald-100 text-emerald-800">
              {t("nav.forFarmers", "For Farmers & FPO Networks")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              {t("landingSections.farmerBenefitsTitle", "Empowering India's Kisan With Fair Earnings & Total Dignity")}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {t(
                "landingSections.farmerBenefitsSubtitle",
                "Every year, Indian farmers lose hard-earned profits to asymmetric mandi rates and high transit deductions. KISANOVA returns power to growers with transparent digital pricing and guaranteed logistics."
              )}
            </p>

            {/* Farmer Earnings Highlight Card */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Typical Realization Difference (1 Quintal Tomato)
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  Verified Data
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500">Traditional Mandi</div>
                  <div className="text-lg font-bold text-slate-700">₹1,400 / Qtl</div>
                  <div className="text-[11px] text-red-600 font-medium mt-0.5">-25% deductions</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-300 shadow-xs">
                  <div className="text-xs text-emerald-700 font-semibold">KISANOVA Net</div>
                  <div className="text-lg font-bold text-emerald-800">₹1,950 / Qtl</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">+39% in pocket</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Grid of 6 Key Farmer Benefits */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{b.title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
