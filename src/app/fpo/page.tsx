import React from "react";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/shared/sign-out-button";

export const dynamic = "force-dynamic";

export default async function FPODashboardPage() {
  const user = await requireRole([USER_ROLES.FPO]);

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="agri-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  FPO Operations Hub
                </span>
                <Badge variant="amber" className="text-[10px] uppercase">
                  {user.role}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Cluster Aggregation &amp; Multi-Member Catalog
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-slate-800">{user.name}</div>
              <div className="text-[11px] text-slate-500">{user.email}</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="agri-container space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/60 via-white to-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  FPO Management Network
                </span>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">
                  {user.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Registered Mobile: <span className="font-mono font-medium">{user.phone}</span> | Status: <span className="text-emerald-700 font-semibold">{user.status}</span>
                </p>
              </div>
              <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs">
                Certified Producer Company
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Member Farmers</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">Active</div>
              <p className="text-[11px] text-slate-500 mt-1">Pooled harvest lots</p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Bulk Inquiries</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">0 Inquiries</div>
              <p className="text-[11px] text-slate-500 mt-1">Direct enterprise demand</p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Aggregated Volume</span>
              <div className="text-2xl font-bold text-slate-900 mt-2">0 Quintals</div>
              <p className="text-[11px] text-slate-500 mt-1">Inventory management ready</p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Logistics Hub</span>
              <div className="text-2xl font-bold text-emerald-700 mt-2">Connected</div>
              <p className="text-[11px] text-slate-500 mt-1">Fleet collection dispatch</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
