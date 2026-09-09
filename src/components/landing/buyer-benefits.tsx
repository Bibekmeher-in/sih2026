"use client";

import React from "react";
import { Building2, ShoppingCart, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";

export function BuyerBenefitsSection() {
  const { t } = useLanguage();

  const buyerPerks = [
    {
      category: "For Bulk Buyers & HoReCa",
      subtitle: "Processors, Supermarkets, Cloud Kitchens, Exporters",
      points: [
        "15% to 20% lower procurement costs by eliminating 3+ broker layers.",
        "Contractual supply predictability directly with registered FPOs.",
        "Consolidated invoices with GST compliance and digital proof of delivery.",
        "Scheduled multi-metric ton deliveries with cold-chain fleet access.",
      ],
    },
    {
      category: "For Retail Consumers",
      subtitle: "Households, Residential Communities, Healthy Living",
      points: [
        "Maximum nutritional freshness: Harvested within 18-24 hours of doorstep arrival.",
        "Affordable prices lower than quick-commerce markups and neighborhood retail stores.",
        "Complete transparency: Know the exact farmer and district behind every kg.",
        "Quality guarantee: Certified Grade-A produce with easy dispute resolution.",
      ],
    },
  ];

  return (
    <section id="buyers" className="py-16 sm:py-20 bg-slate-50/50 border-b border-slate-200">
      <div className="agri-container">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="blue" className="mb-3 px-3 py-1 font-semibold text-xs">
            {t("nav.forBuyers", "For Bulk Buyers & Consumers")}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {t("landingSections.buyerBenefitsTitle", "Procurement Built for Commercial Buyers")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            {t(
              "landingSections.buyerBenefitsSubtitle",
              "Whether you are procuring 25 metric tons of tomatoes for food processing or 5 kg of fresh vegetables for your family, KISANOVA delivers pure farm-gate quality."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {buyerPerks.map((group, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                  {idx === 0 ? <Building2 className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{group.category}</h3>
                  <p className="text-xs text-slate-500">{group.subtitle}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5">
                {group.points.map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-3 text-sm text-slate-700">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
