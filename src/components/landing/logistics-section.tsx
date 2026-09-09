"use client";

import React from "react";
import { Truck, Navigation, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";

export function LogisticsSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Navigation,
      title: "Automated Multi-Stop Route Optimization",
      desc: "Computes the most fuel-efficient and shortest transit paths connecting multiple farm pickup coordinates to central distribution hubs.",
    },
    {
      icon: Truck,
      title: "Smart Fleet & Payload Allocation",
      desc: "Matches pickup volume to the optimal vehicle class (Tata Ace, 407, or heavy multi-axle trucks) to prevent under-capacity runs and empty backhauls.",
    },
    {
      icon: Clock,
      title: "Perishability-Aware Scheduling",
      desc: "Highly perishable crops like tomatoes, leafy greens, and strawberries receive expedited logistics priority with transit time limits under 18 hours.",
    },
    {
      icon: MapPin,
      title: "OpenStreetMap & GPS Telemetry",
      desc: "Real-time location updates powered by open geospatial mapping tools, providing verifiable delivery timestamps and proof-of-delivery.",
    },
  ];

  return (
    <section id="logistics" className="py-16 sm:py-20 bg-slate-50/50 border-b border-slate-200">
      <div className="agri-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6">
            <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs bg-emerald-100 text-emerald-800">
              {t("nav.logistics", "Supply Chain & Fleet Logistics")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              {t("landingSections.logisticsTitle", "Clustered Farm-to-Fork Route Logistics")}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {t(
                "landingSections.logisticsSubtitle",
                "India's agricultural logistics suffer from fragmented unorganized trucking and idle mileage. KISANOVA combines rural collection hubs with dynamic route scheduling to drastically cut freight costs and eliminate transit spoilage."
              )}
            </p>

            <div className="space-y-4 pt-2">
              {features.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Visual Hub-and-Spoke Card */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    Live Dispatch Route Simulation
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Nashik Cluster → Mumbai Hub 04
                  </h3>
                </div>
                <Badge variant="amber" className="text-xs font-semibold">
                  Transit: 4.5 hrs
                </Badge>
              </div>

              {/* Waypoints diagram */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                    A
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-semibold text-slate-800">Farm Gate 1 (Dindori, Nashik)</div>
                    <div className="text-slate-500">Pickup: 2,500 kg Hybrid Tomato</div>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">Completed</span>
                </div>

                <div className="h-6 ml-3.5 border-l-2 border-dashed border-emerald-300" />

                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                    B
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-semibold text-slate-800">FPO Aggregation Hub (Pimpalgaon)</div>
                    <div className="text-slate-500">Pickup: 4,000 kg Red Onion</div>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">Completed</span>
                </div>

                <div className="h-6 ml-3.5 border-l-2 border-dashed border-slate-300" />

                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-bold shrink-0">
                    C
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-semibold text-slate-800">Vashi Central Distribution Terminal</div>
                    <div className="text-slate-500">Direct Bulk Offload to 12 Verified Retailers</div>
                  </div>
                  <span className="text-[11px] text-sky-700 font-medium">In Transit</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Vehicle: Tata 407 (MH-15-EG-4921)</span>
                <span className="font-semibold text-emerald-700">Capacity: 92% Loaded</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
