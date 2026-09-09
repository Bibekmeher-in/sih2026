import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { Tractor, Sprout, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { FarmerNav } from "@/components/farmer/farmer-nav";
import { NotificationBell } from "@/components/shared/notification-bell";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export const dynamic = "force-dynamic";

export default async function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole([USER_ROLES.FARMER]);

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* Top Portal Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/farmer/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs">
                <Tractor className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-slate-900 leading-none">
                    Kisan<span className="text-emerald-700">Direct</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 border-emerald-300 text-emerald-800 bg-emerald-50">
                    Farmer Portal
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400">Direct Farm-Gate Seller Node</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Sprout className="h-3.5 w-3.5" />
              <span>Explore Marketplace</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            <div className="hidden sm:block text-right border-r border-slate-200 pr-3 mr-1">
              <div className="text-xs font-bold text-slate-800">{user.name}</div>
              <div className="text-[10px] text-slate-500 font-mono">{user.phone}</div>
            </div>

            <LanguageSwitcher />
            <NotificationBell />
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        <FarmerNav />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
