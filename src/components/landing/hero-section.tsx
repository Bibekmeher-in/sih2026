"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Users,
  Store,
  Building2,
  Tractor,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-white py-16 sm:py-24 border-b border-slate-200/80">
      <div className="agri-container">
        {/* Badge Banner */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-center">
          <Badge variant="amber" className="px-3 py-1 font-medium text-xs">
            {t("landing.heroBadge", "Direct Farm-to-Fork & FPO Trade Architecture")}
          </Badge>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
            {t("landing.heroAiBadge", "AI Demand & Price Intelligence")}
          </span>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            {t("landing.heroTitlePart1", "Connect Directly.")}{" "}
            <br className="hidden sm:inline" />
            <span className="text-emerald-700">
              {t("landing.heroTitleHighlight", "Earn Better.")}
            </span>{" "}
            {t("landing.heroTitlePart2", "Buy Smarter.")}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t(
              "landing.heroSubtitle",
              "KisanDirect bridges the gap between Indian farmers, FPOs, bulk institutional buyers, and urban consumers. Eliminating middlemen commission while powering dynamic pricing, route-optimized logistics, and AI demand forecasting."
            )}
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button size="lg" className="w-full sm:w-auto px-8 shadow-md" asChild>
              <Link href="/register" className="flex items-center justify-center gap-2">
                <span>{t("landing.ctaJoin", "Join KisanDirect")}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/login">{t("landing.ctaSignIn", "Sign In to Portal")}</Link>
            </Button>
          </div>

          {/* Key Measurable Metric Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700">+28%</div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
                {t("landing.statFarmerRealization", "Farmer Realization Over Mandi")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">-18%</div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
                {t("landing.statProcurementCost", "Lower Procurement Cost for Buyers")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700">&lt;24 hrs</div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
                {t("landing.statDispatchTime", "Farm Gate to Delivery Dispatch")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl sm:text-3xl font-bold text-amber-700">0%</div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">
                {t("landing.statZeroCommission", "Middlemen Commissions")}
              </p>
            </div>
          </div>
        </div>

        {/* Role Portal Selection Bar */}
        <div id="portal-selection" className="mt-16 pt-12 border-t border-slate-200 max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
              {t("landing.portalAccessSubtitle", "Role-Based Authentication Access")}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {t("landing.portalAccessTitle", "Access Your Dedicated Role Portal")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Farmer */}
            <Link
              href="/login?callbackUrl=/farmer"
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all group block"
            >
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <Tractor className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700">
                {t("nav.farmerPortal", "Farmer")}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("landing.farmerDesc", "List harvests, check AI mandi rates, track earnings.")}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>{t("landing.enterPortal", "Enter Portal")}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>

            {/* FPO */}
            <Link
              href="/login?callbackUrl=/fpo"
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all group block"
            >
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700">
                FPO Hub
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("landing.fpoDesc", "Multi-farmer aggregation, bulk catalog, regional clusters.")}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>{t("landing.enterPortal", "Enter Portal")}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>

            {/* Bulk Buyer */}
            <Link
              href="/login?callbackUrl=/buyer"
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all group block"
            >
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700">
                {t("nav.buyerPortal", "Bulk Buyer")}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("landing.buyerDesc", "Contract lots by metric tons, demand forecasting, schedule.")}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>{t("landing.enterPortal", "Enter Portal")}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>

            {/* Consumer */}
            <Link
              href="/login?callbackUrl=/consumer"
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all group block"
            >
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <Store className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700">
                {t("nav.consumerPortal", "Consumer")}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("landing.consumerDesc", "Farm fresh daily vegetables, traceable origin, door delivery.")}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>{t("landing.enterPortal", "Enter Portal")}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>

            {/* Admin */}
            <Link
              href="/login?callbackUrl=/admin"
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all group block"
            >
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700">
                {t("nav.adminPortal", "Admin Ops")}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("landing.adminDesc", "Fleet dispatch, route optimization, Mandi telemetry.")}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>{t("landing.enterPortal", "Enter Portal")}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
