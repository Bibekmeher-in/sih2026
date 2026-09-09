"use client";

import React from "react";
import { ArrowRight, Tractor, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

export function CTASection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-emerald-50/50">
      <div className="agri-container">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-900 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
          {/* Subtle decorative background accent */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-emerald-800/50 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-300">
              {t("common.tagline", "Direct Agriculture Trade Network")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-white leading-tight">
              {t("landingSections.ctaTitle", "Transforming Indian Agriculture, One Harvest at a Time")}
            </h2>
            <p className="mt-4 text-emerald-100/90 text-base sm:text-lg leading-relaxed">
              {t(
                "landingSections.ctaSubtitle",
                "Join thousands of farmers, FPOs, wholesale buyers, and families experiencing direct, transparent, and fair agricultural trade."
              )}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold shadow-md"
                asChild
              >
                <a href="#portal-selection" className="flex items-center gap-2">
                  <Tractor className="h-5 w-5 text-emerald-700" />
                  <span>Join as Farmer or FPO</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-emerald-700 bg-emerald-800/60 text-white hover:bg-emerald-800 font-semibold"
                asChild
              >
                <a href="#portal-selection" className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-300" />
                  <span>Register as Bulk Buyer</span>
                </a>
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-emerald-800/80 flex flex-wrap items-center gap-6 text-xs text-emerald-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero registration fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>GST &amp; APMC Compliant Invoicing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Direct bank account settlements</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
