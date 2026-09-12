"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Truck, MapPin, CheckCircle2, User, Navigation, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const LeafletMap = dynamic(() => import("@/components/logistics/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs animate-pulse">
      Loading Regional Fleet Telemetry Map...
    </div>
  ),
});

interface FleetMapClientProps {
  deliveries: any[];
  partners: any[];
}

export default function AdminFleetMapClient({ deliveries, partners }: FleetMapClientProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Convert deliveries to pickups & waypoints for map
  const pickups = deliveries.map((d) => ({
    name: `Order #${d.order?.orderNumber || "OD"} (${d.pickupLocation.name})`,
    location: {
      latitude: d.pickupLocation.latitude,
      longitude: d.pickupLocation.longitude,
    },
    stopType: "FARM_PICKUP" as const,
  }));

  const activeDrivers = partners.filter((p) => p.currentLocation?.latitude);

  return (
    <div className="space-y-4">
      {/* Title Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Regional Fleet &amp; Dispatches Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Spatial monitoring of farm gate collection hubs, active in-transit dispatches, and online delivery partners
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{partners.length} Drivers Online</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-blue-700">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span>{deliveries.length} Active Trips</span>
          </div>
        </div>
      </div>

      {/* Map & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
          <LeafletMap
            origin={{
              name: "Odisha Central Hub (Bhubaneswar)",
              location: { latitude: 20.2961, longitude: 85.8245 },
              stopType: "ORIGIN",
            }}
            pickups={pickups}
            height="520px"
          />
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active In-Transit Dispatches ({deliveries.length})
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {deliveries.length > 0 ? (
                deliveries.map((d) => (
                  <div
                    key={d._id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900">
                        Order #{d.order?.orderNumber}
                      </span>
                      <Badge className="bg-slate-900 text-emerald-400 text-[9px] font-bold py-0">
                        {d.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      <div>From: {d.pickupLocation.name}</div>
                      <div>To: {d.destination.name}</div>
                      {d.driverName && (
                        <div className="font-semibold text-slate-800 mt-1">
                          Driver: {d.driverName}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-1">
                      <Link
                        href={`/admin/deliveries/${d._id}/track`}
                        className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Live Telemetry</span>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No active dispatches currently on road.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
