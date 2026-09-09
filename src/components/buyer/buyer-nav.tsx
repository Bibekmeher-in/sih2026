"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  FileSpreadsheet,
  PackageCheck,
  Building2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

export function BuyerNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      href: "/buyer/dashboard",
      label: t("portalNav.overview", "Overview"),
      icon: LayoutDashboard,
    },
    {
      href: "/buyer/marketplace",
      label: t("portalNav.marketplace", "Wholesale Lots"),
      icon: Store,
    },
    {
      href: "/buyer/requirements",
      label: t("portalNav.requirements", "Bulk RFQs"),
      icon: FileSpreadsheet,
    },
    {
      href: "/buyer/orders",
      label: t("portalNav.orders", "Purchase Orders"),
      icon: PackageCheck,
    },
    {
      href: "/buyer/suppliers",
      label: t("portalNav.suppliers", "Supplier Directory"),
      icon: Building2,
    },
    {
      href: "/buyer/analytics",
      label: t("portalNav.analytics", "Procurement Analytics"),
      icon: BarChart3,
    },
  ];

  return (
    <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/buyer/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
