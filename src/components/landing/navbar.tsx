"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sprout, Menu, X, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, setDrawerOpen } = useCart();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="agri-container flex h-16 items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-sm transition-transform group-hover:scale-105">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Kisan<span className="text-emerald-700">ova</span>
            </span>
            <p className="text-[11px] text-slate-500 font-medium">{t("common.tagline")}</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/marketplace" className="text-emerald-700 font-semibold hover:text-emerald-800 transition-colors flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {t("nav.marketplace")}
          </Link>
          <Link href="/#problem" className="hover:text-emerald-700 transition-colors">
            {t("nav.problem")}
          </Link>
          <Link href="/#how-it-works" className="hover:text-emerald-700 transition-colors">
            {t("nav.howItWorks")}
          </Link>
          <Link href="/#farmers" className="hover:text-emerald-700 transition-colors">
            {t("nav.forFarmers")}
          </Link>
          <Link href="/#buyers" className="hover:text-emerald-700 transition-colors">
            {t("nav.forBuyers")}
          </Link>
          <Link href="/#ai" className="hover:text-emerald-700 transition-colors">
            {t("nav.aiEngine")}
          </Link>
          <Link href="/#logistics" className="hover:text-emerald-700 transition-colors">
            {t("nav.logistics")}
          </Link>
          <Link href="/login?callbackUrl=/delivery/dashboard" className="hover:text-emerald-700 transition-colors text-slate-700 font-medium">
            Delivery Boy
          </Link>
        </nav>

        {/* Desktop Portal Shortcuts, Cart & Status (Large screens) */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Cart Drawer Trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative p-2 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
            aria-label="Open Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow">
                {itemCount}
              </span>
            )}
          </button>

          <Button variant="outline" size="sm" asChild>
            <Link href="/login">{t("common.signIn")}</Link>
          </Button>

          <Button size="sm" asChild>
            <Link href="/register" className="flex items-center gap-1">
              <span>{t("common.register")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Mobile & Tablet controls (<1024px) */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative p-2 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200"
            aria-label="Open Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none rounded-lg border border-slate-200 bg-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-4 space-y-3 shadow-xl">
          <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <Link
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-between"
            >
              <span>{t("common.exploreMarketplace")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#problem"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {t("nav.problem")}
            </Link>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {t("nav.howItWorks")}
            </a>
            <a
              href="#farmers"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {t("nav.forFarmers")}
            </a>
            <a
              href="#buyers"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {t("nav.forBuyers")}
            </a>
            <a
              href="#ai"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {t("nav.aiEngine")}
            </a>
            <a
              href="#logistics"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {t("nav.logistics")}
            </a>
            <Link
              href="/login?callbackUrl=/delivery/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg font-semibold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 flex items-center justify-between"
            >
              <span>Delivery Boy Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>{t("common.signIn")}</Link>
              </Button>
              <Button size="sm" asChild className="w-full">
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>{t("common.register")}</Link>
              </Button>
            </div>
            <Button size="sm" variant="secondary" asChild className="w-full">
              <a href="#portal-selection" onClick={() => setMobileMenuOpen(false)}>
                {t("landing.ctaPortals")}
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
