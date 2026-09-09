import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import {
  getLogisticsOverview,
  getVehicles,
  getDeliveries,
} from "@/lib/logistics-service";
import {
  optimizeRouteNearestNeighbor,
  DEFAULT_DEMO_LOGISTICS_SCENARIO,
} from "@/lib/route-optimizer";
import AdminLogisticsClient from "@/components/admin/logistics-client";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Truck } from "lucide-react";
import { SignOutButton } from "@/components/shared/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AdminLogisticsPage() {
  const user = await requireRole([USER_ROLES.ADMIN]);

  const [stats, vehicles, deliveries] = await Promise.all([
    getLogisticsOverview(),
    getVehicles(),
    getDeliveries(),
  ]);

  const comparison = optimizeRouteNearestNeighbor(
    DEFAULT_DEMO_LOGISTICS_SCENARIO.origin,
    DEFAULT_DEMO_LOGISTICS_SCENARIO.pickups,
    DEFAULT_DEMO_LOGISTICS_SCENARIO.destination
  );

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="agri-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-800 text-white">
              <Truck className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  Logistics &amp; Route Telemetry
                </span>
                <Badge className="bg-slate-900 text-white font-mono text-[10px]">
                  FPO Fleet AI
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Multi-Stop Farm Aggregation, Nearest-Neighbor Routing &amp; Fleet Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-slate-800">{user.name}</div>
              <div className="text-[11px] text-slate-500">Fleet Master Control</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-8">
        <div className="agri-container space-y-6">
          <AdminLogisticsClient
            initialStats={stats}
            initialComparison={comparison}
            initialVehicles={JSON.parse(JSON.stringify(vehicles))}
            initialDeliveries={JSON.parse(JSON.stringify(deliveries))}
          />
        </div>
      </main>
    </div>
  );
}
