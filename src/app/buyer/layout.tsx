import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { BuyerNav } from "@/components/buyer/buyer-nav";
import { BuyerAssistantModal } from "@/components/buyer/buyer-assistant-modal";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { Building2, ShieldCheck, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/shared/notification-bell";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export const dynamic = "force-dynamic";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole([USER_ROLES.BULK_BUYER]);

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      {/* Top Bulk Buyer Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="agri-container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/buyer/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base tracking-tight">
                    KisanDirect
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold text-slate-800 border-slate-300 uppercase py-0 px-1.5">
                    B2B Wholesale Portal
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Institutional &amp; Food Processor Direct Farm Procurement
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 font-medium">
              <Scale className="h-3.5 w-3.5 text-slate-600" />
              <span>Metric Ton Sourcing • Escrow Settled</span>
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">{user.name}</div>
              <div className="text-[11px] text-slate-500">{user.email}</div>
            </div>

            <LanguageSwitcher />
            <NotificationBell />
            <SignOutButton />
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-2">
          <div className="agri-container flex items-center justify-between gap-3">
            <BuyerNav />
            <div className="flex items-center gap-3">
              <BuyerAssistantModal />
              <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>GST &amp; APMC Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-6 sm:py-8">{children}</main>
    </div>
  );
}
