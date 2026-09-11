"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sprout,
  PlusCircle,
  Package,
  IndianRupee,
  TrendingUp,
  Tag,
  Truck,
  User,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

export function FarmerNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      label: t("portalNav.dashboard", "Dashboard"),
      href: "/farmer/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: t("portalNav.aiInsights", "AI Insights Hub"),
      href: "/farmer/ai-insights",
      icon: Sparkles,
    },
    {
      label: t("portalNav.products", "My Produce & Inventory"),
      href: "/farmer/products",
      icon: Sprout,
    },
    {
      label: t("farmer.addProduct", "Add New Produce"),
      href: "/farmer/products/new",
      icon: PlusCircle,
    },
    {
      label: t("portalNav.orders", "Incoming Orders"),
      href: "/farmer/orders",
      icon: Package,
    },
    {
      label: t("portalNav.earnings", "Earnings & Analytics"),
      href: "/farmer/earnings",
      icon: IndianRupee,
    },
    {
      label: t("portalNav.forecast", "Demand Forecast"),
      href: "/farmer/forecast",
      icon: TrendingUp,
    },
    {
      label: t("portalNav.pricing", "AI Price Advisor"),
      href: "/farmer/pricing",
      icon: Tag,
    },
    {
      label: t("portalNav.deliveries", "Logistics & Deliveries"),
      href: "/farmer/deliveries",
      icon: Truck,
    },
    {
      label: "FPO & Community Hub",
      href: "/fpo",
      icon: Users,
    },
    {
      label: t("portalNav.profile", "Farm Profile"),
      href: "/farmer/profile",
      icon: User,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-2.5 sm:p-4 shrink-0 min-w-0">
      <div className="mb-4 hidden lg:block">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
          {t("nav.farmerPortal", "Farmer Operations")}
        </span>
      </div>

      <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none min-w-0 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/farmer/dashboard" && pathname === "/farmer") ||
            (item.href !== "/farmer/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                isActive
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-200" : "text-slate-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pt-6 border-t border-slate-100 hidden lg:block">
        <Link
          href="/marketplace"
          className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors text-xs font-semibold"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-emerald-700" />
            <span>Public Marketplace</span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
            Live
          </span>
        </Link>
      </div>
    </aside>
  );
}
