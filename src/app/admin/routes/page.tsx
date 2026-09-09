import { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Route Optimization Console | KisanDirect Admin",
  description: "Nearest-Neighbor Greedy Heuristic & 2-Opt Multi-Farm Collection Planning",
};

export const dynamic = "force-dynamic";

export default async function AdminRoutesPage() {
  await requireRole([USER_ROLES.ADMIN]);

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
    <div className="agri-container space-y-6">
      <AdminLogisticsClient
        initialStats={stats}
        initialComparison={comparison}
        initialVehicles={JSON.parse(JSON.stringify(vehicles))}
        initialDeliveries={JSON.parse(JSON.stringify(deliveries))}
        defaultTab="OPTIMIZER"
      />
    </div>
  );
}
