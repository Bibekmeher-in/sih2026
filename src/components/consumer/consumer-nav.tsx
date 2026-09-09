"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  PackageCheck,
  Store,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";

export function ConsumerNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { t } = useLanguage();

  const navItems = [
    {
      href: "/consumer/dashboard",
      label: t("portalNav.overview", "Overview"),
      icon: LayoutDashboard,
    },
    {
      href: "/consumer/cart",
      label: t("portalNav.cart", "Farm Cart"),
      icon: ShoppingCart,
      isCart: true,
    },
    {
      href: "/consumer/orders",
      label: t("portalNav.myOrders", "My Orders & Tracking"),
      icon: PackageCheck,
    },
  ];

  return (
    <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/consumer/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
              isActive
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
            {item.isCart && itemCount > 0 && (
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                  isActive ? "bg-white text-emerald-800" : "bg-emerald-600 text-white"
                )}
              >
                {itemCount}
              </span>
            )}
          </Link>
        );
      })}

      <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

      <Link
        href="/marketplace"
        className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors"
      >
        <Store className="h-3.5 w-3.5" />
        <span>{t("portalNav.marketplace", "Marketplace")}</span>
        <ArrowUpRight className="h-3 w-3 text-slate-400" />
      </Link>
    </nav>
  );
}
