import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { ConsumerNav } from "@/components/consumer/consumer-nav";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { Sprout, ShieldCheck, HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/shared/notification-bell";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export const dynamic = "force-dynamic";

export default async function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole([USER_ROLES.CONSUMER]);

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      {/* Top Consumer Portal Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="agri-container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/consumer/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base tracking-tight">
                    KisanDirect
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 border-emerald-300 uppercase py-0 px-1.5">
                    Direct Consumer
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Farm-to-Fork Direct Vegetable &amp; Fruit Procurement
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-800 font-medium">
              <HeartHandshake className="h-3.5 w-3.5 text-emerald-600" />
              <span>100% Farm-Gate Direct</span>
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
          <div className="agri-container flex items-center justify-between">
            <ConsumerNav />
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Direct Bank Escrow Protection</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-6 sm:py-8">{children}</main>
    </div>
  );
}
