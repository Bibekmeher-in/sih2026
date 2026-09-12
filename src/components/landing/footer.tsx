"use client";

import React from "react";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-sm">
      <div className="agri-container py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs">
                <Sprout className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Kisan<span className="text-emerald-700">ova</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm">
              {t(
                "landing.heroSubtitle",
                "Empowering India's agricultural ecosystem with direct market access, AI-driven demand forecasting, fair price discovery, and integrated logistics."
              )}
            </p>
          </div>

          {/* Col 3: Role Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              {t("nav.portalSelection", "Application Portals")}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#portal-selection" className="hover:text-emerald-700 transition-colors">
                  {t("nav.farmerPortal", "Farmer Portal")}
                </a>
              </li>
              <li>
                <a href="#portal-selection" className="hover:text-emerald-700 transition-colors">
                  FPO Hub
                </a>
              </li>
              <li>
                <a href="#portal-selection" className="hover:text-emerald-700 transition-colors">
                  {t("nav.buyerPortal", "Buyer Portal")}
                </a>
              </li>
              <li>
                <a href="#portal-selection" className="hover:text-emerald-700 transition-colors">
                  {t("nav.consumerPortal", "Consumer Portal")}
                </a>
              </li>
              <li>
                <a href="#portal-selection" className="hover:text-emerald-700 transition-colors">
                  {t("nav.adminPortal", "Admin Portal")}
                </a>
              </li>
              <li>
                <Link href="/login?callbackUrl=/delivery/dashboard" className="hover:text-emerald-700 transition-colors text-emerald-800 font-medium">
                  Delivery Boy Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Architecture */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              {t("common.appName", "KISANOVA")}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#problem" className="hover:text-emerald-700 transition-colors">
                  {t("nav.problem", "Problem & Context")}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-700 transition-colors">
                  {t("nav.howItWorks", "How It Works")}
                </a>
              </li>
              <li>
                <a href="#ai" className="hover:text-emerald-700 transition-colors">
                  {t("nav.aiEngine", "AI Engine")}
                </a>
              </li>
              <li>
                <a href="#logistics" className="hover:text-emerald-700 transition-colors">
                  {t("nav.logistics", "Route Optimization")}
                </a>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-emerald-700 transition-colors">
                  {t("nav.marketplace", "Produce Marketplace")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Compliance & Security */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Platform &amp; Tech
            </h4>
            <div className="space-y-2 text-xs text-slate-500">
              <p>Next.js 16 + TypeScript</p>
              <p>MongoDB Atlas &amp; Mongoose</p>
              <p>Leaflet &amp; OpenStreetMap</p>
              <p>Server-side Zod Validation</p>
              <p className="text-emerald-700 font-semibold pt-1">
                Zero Exposed Client Secrets
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} KISANOVA. Direct Agricultural Trade Network.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with precision for Indian agriculture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
