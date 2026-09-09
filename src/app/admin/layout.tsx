import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { Layers, ShoppingBag, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSeedTrigger } from "@/components/admin/seed-trigger";
import { NotificationBell } from "@/components/shared/notification-bell";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole([USER_ROLES.ADMIN]);

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      {/* Top Admin Command Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs shadow-xs">
        <div className="agri-container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <Layers className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base tracking-tight">
                    KisanDirect
                  </span>
                  <Badge variant="destructive" className="text-[10px] font-bold uppercase py-0 px-1.5 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    <span>Admin Console</span>
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  National Agritech Oversight, Moderation &amp; Logistics Control
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/marketplace"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-emerald-700" />
              <span>Public Marketplace</span>
            </Link>

            <AdminSeedTrigger />

            <div className="text-right hidden lg:block border-l border-slate-200 pl-3 ml-1">
              <div className="text-xs font-semibold text-slate-900">{user.name}</div>
              <div className="text-[11px] text-slate-500">{user.email}</div>
            </div>

            <LanguageSwitcher />
            <NotificationBell />
            <SignOutButton />
          </div>
        </div>

        {/* Sub-Navigation Bar */}
        <div className="border-t border-slate-200/80 bg-slate-50/90 px-4 sm:px-6">
          <div className="agri-container">
            <AdminNav />
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 py-6 sm:py-8">{children}</main>
    </div>
  );
}
