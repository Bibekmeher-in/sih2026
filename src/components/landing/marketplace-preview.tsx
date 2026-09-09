"use client";

import React from "react";
import { MapPin, Calendar, CheckCircle2, TrendingUp, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

export function MarketplacePreviewSection() {
  const { t } = useLanguage();

  const previewCrops = [
    {
      name: "Hybrid Red Tomato",
      variety: "Abhinav 1057",
      farmer: "Rameshwar Patil",
      type: "Individual Farmer",
      location: "Junnar, Pune",
      state: "Maharashtra",
      available: "120 Quintals",
      kisanPrice: 24,
      mandiPrice: 16,
      grade: "Grade A",
      harvested: "Harvested Yesterday",
      badgeColor: "default",
    },
    {
      name: "Nashik Red Onion",
      variety: "Gavran Summer",
      farmer: "Sahyadri Farmers Producer Co.",
      type: "Registered FPO",
      location: "Lasalgaon, Nashik",
      state: "Maharashtra",
      available: "450 Quintals",
      kisanPrice: 28,
      mandiPrice: 21,
      grade: "Grade A",
      harvested: "Cured & Stored (Grade A)",
      badgeColor: "amber",
    },
    {
      name: "Pusa Basmati Rice 1121",
      variety: "Long Grain Milled",
      farmer: "Malwa Agri Cooperative",
      type: "Registered FPO",
      location: "Amritsar",
      state: "Punjab",
      available: "200 Quintals",
      kisanPrice: 84,
      mandiPrice: 71,
      grade: "Premium Export Grade",
      harvested: "Aged 12 Months",
      badgeColor: "blue",
    },
    {
      name: "Jyoti Table Potato",
      variety: "Kufri Jyoti",
      farmer: "Mahendra Singh Verma",
      type: "Individual Farmer",
      location: "Khandari, Agra",
      state: "Uttar Pradesh",
      available: "300 Quintals",
      kisanPrice: 18,
      mandiPrice: 13,
      grade: "Grade A",
      harvested: "Cold Storage Sorted",
      badgeColor: "default",
    },
    {
      name: "Spicy Green Chilli",
      variety: "G4 Green Wonder",
      farmer: "Suresh Chandra Das",
      type: "Individual Farmer",
      location: "Guntur",
      state: "Andhra Pradesh",
      available: "80 Quintals",
      kisanPrice: 42,
      mandiPrice: 32,
      grade: "Grade A",
      harvested: "Fresh Plucked Today",
      badgeColor: "default",
    },
    {
      name: "Nagpur Sweet Orange",
      variety: "Nagpur Mandarin",
      farmer: "Vidarbha Citrus FPO",
      type: "Registered FPO",
      location: "Katol, Nagpur",
      state: "Maharashtra",
      available: "500 Quintals",
      kisanPrice: 55,
      mandiPrice: 41,
      grade: "Export Table Grade",
      harvested: "Tree Ripened",
      badgeColor: "amber",
    },
  ];

  return (
    <section id="marketplace-preview" className="py-16 sm:py-20 bg-white border-b border-slate-200">
      <div className="agri-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <Badge variant="secondary" className="mb-2 px-3 py-1 font-semibold text-xs">
              {t("marketplace.title", "Live Produce Catalog Preview")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {t("marketplace.subtitle", "Verified Farm Gate Listings")}
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Transparent crop grades, real Indian mandi price benchmarks, and direct producer contracts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Updated every 30 mins from Mandi API</span>
          </div>
        </div>

        {/* Crops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewCrops.map((crop, idx) => {
            const extraMarginPercent = Math.round(
              ((crop.kisanPrice - crop.mandiPrice) / crop.mandiPrice) * 100
            );

            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-500">{crop.variety}</span>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {crop.name}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="text-[11px] font-bold py-0.5">
                      {crop.grade}
                    </Badge>
                  </div>

                  {/* Producer & Location */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{crop.farmer}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({crop.type})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{crop.location}, {crop.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{crop.harvested}</span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Scale className="h-3.5 w-3.5 text-slate-400" /> Available Lot:
                    </span>
                    <span className="font-bold text-slate-800">{crop.available}</span>
                  </div>

                  {/* Price Comparison Box */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <div className="text-[11px] text-slate-500">Mandi Rate</div>
                      <div className="text-sm font-semibold text-slate-600 line-through">
                        ₹{crop.mandiPrice}/kg
                      </div>
                    </div>
                    <div className="p-2 rounded bg-emerald-50/80 border border-emerald-200">
                      <div className="text-[11px] text-emerald-700 font-semibold">KisanDirect Price</div>
                      <div className="text-base font-bold text-emerald-800">
                        ₹{crop.kisanPrice}/kg
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <TrendingUp className="h-3 w-3" />
                      +{extraMarginPercent}% extra direct grower payout
                    </span>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold" asChild>
                    <a href="#portal-selection">Order Lot via Buyer Portal</a>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
