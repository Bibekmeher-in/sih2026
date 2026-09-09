"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Tractor,
  Building2,
  ShoppingBag,
  Package,
  ShoppingCart,
  Truck,
  Car,
  MapPin,
  BarChart3,
  Sparkles,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

export function AdminNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      label: t("portalNav.overview", "Overview"),
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: t("portalNav.allUsers", "All Users"),
      href: "/admin/users",
      icon: Users,
    },
    {
      label: t("portalNav.farmers", "Farmers"),
      href: "/admin/farmers",
      icon: Tractor,
    },
    {
      label: t("portalNav.fpos", "FPOs"),
      href: "/admin/fpos",
      icon: Building2,
    },
    {
      label: t("portalNav.buyers", "Buyers"),
      href: "/admin/buyers",
      icon: ShoppingBag,
    },
    {
      label: t("portalNav.products", "Products"),
      href: "/admin/products",
      icon: Package,
    },
    {
      label: t("portalNav.orders", "Orders"),
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      label: t("portalNav.deliveries", "Deliveries"),
      href: "/admin/deliveries",
      icon: Truck,
    },
    {
      label: t("portalNav.vehicles", "Vehicles"),
      href: "/admin/vehicles",
      icon: Car,
    },
    {
      label: t("portalNav.routes", "Routes"),
      href: "/admin/routes",
      icon: MapPin,
    },
    {
      label: t("portalNav.analytics", "Analytics"),
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      label: t("portalNav.aiInsights", "AI Intelligence"),
      href: "/admin/ai",
      icon: Sparkles,
    },
    {
      label: t("portalNav.impact", "Impact Analytics"),
      href: "/admin/impact",
      icon: Award,
    },
  ];

  return (
    <nav className="flex items-center gap-1 overflow-x-auto py-2 px-1 scrollbar-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href === "/admin/dashboard" && pathname === "/admin") ||
          (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                isActive ? "text-emerald-400" : "text-slate-400"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
