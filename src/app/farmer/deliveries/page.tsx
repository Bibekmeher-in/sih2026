"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  ThermometerSnowflake,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DeliveryLocationObj {
  name?: string;
  address?: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
}

interface DeliveryItem {
  _id: string;
  trackingNumber: string;
  orderNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  pickupLocation: string | DeliveryLocationObj;
  dropLocation: string | DeliveryLocationObj;
  status: string;
  distanceKm: number;
  estimatedHours: number;
  coldChainTempCelsius?: number;
  pickupTime: string;
  eta?: string;
  deliveredTime?: string;
}

function formatLocation(
  loc: string | DeliveryLocationObj | undefined,
  fallback: string
): string {
  if (!loc) return fallback;
  if (typeof loc === "string") return loc;
  if (typeof loc === "object") {
    const parts = [loc.name || loc.address, loc.district, loc.state].filter(Boolean);
    return parts.join(", ") || fallback;
  }
  return fallback;
}

export default function FarmerDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeliveries() {
      try {
        const res = await fetch("/api/farmer/deliveries");
        const json = await res.json();
        if (json.success) {
          setDeliveries(json.deliveries);
        }
      } catch (err) {
        console.error("Error loading deliveries:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDeliveries();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Farm Gate Dispatch &amp; Deliveries
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time fleet tracking, assigned carrier vehicles, and cold-chain temperature monitoring
        </p>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Loading logistics dispatches...
        </div>
      ) : deliveries.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <Truck className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No active dispatches</p>
          <p className="text-xs text-slate-500">Assigned transport vehicles will appear here upon order packing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {deliveries.map((del) => {
            const isInTransit = del.status === "IN_TRANSIT";

            return (
              <div
                key={del._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4 hover:shadow-xs transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {del.trackingNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      (Order: {del.orderNumber})
                    </span>
                  </div>

                  <Badge
                    variant={isInTransit ? "default" : "secondary"}
                    className={`text-xs font-bold ${
                      isInTransit
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    <Truck className="h-3 w-3 mr-1" />
                    <span>{del.status.replace(/_/g, " ")}</span>
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Route & Distance */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-medium">Route Information</span>
                    <div className="flex items-start gap-1.5 text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 block">Pickup:</span>
                        <span className="font-semibold text-slate-900">
                          {formatLocation(del.pickupLocation, "Farm Gate Hub")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-700 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 block">Destination:</span>
                        <span className="font-semibold text-slate-900">
                          {formatLocation(del.dropLocation, "Delivery Destination Hub")}
                        </span>
                      </div>
                    </div>
                    <div className="pt-1 font-mono text-slate-500 font-semibold">
                      Total Transit: {del.distanceKm} km (~{del.estimatedHours} hrs)
                    </div>
                  </div>

                  {/* Vehicle & Driver */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-medium">Assigned Vehicle &amp; Driver</span>
                    <div className="font-bold text-slate-900 text-sm">{del.vehicleType}</div>
                    <div className="font-mono font-bold text-slate-800 bg-slate-100 inline-block px-2 py-0.5 rounded">
                      {del.vehicleNumber}
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-slate-700">
                      <span className="font-semibold">{del.driverName}</span>
                      <div className="flex items-center gap-1 text-slate-500 font-mono">
                        <Phone className="h-3 w-3" />
                        <span>{del.driverPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cold Chain & Timestamps */}
                  <div className="space-y-2">
                    <span className="text-slate-400 font-medium">Telemetry &amp; Transit</span>
                    {del.coldChainTempCelsius !== undefined && (
                      <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-cyan-900 font-semibold">
                          <ThermometerSnowflake className="h-4 w-4 text-cyan-700" />
                          <span>Cold-Chain Reefer:</span>
                        </div>
                        <span className="font-mono font-extrabold text-cyan-800">
                          {del.coldChainTempCelsius}°C
                        </span>
                      </div>
                    )}

                    <div className="text-slate-600 text-[11px] space-y-1">
                      <div>
                        Pickup:{" "}
                        <span className="font-mono text-slate-900 font-medium">
                          {new Date(del.pickupTime).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {del.eta && (
                        <div>
                          Estimated Arrival:{" "}
                          <span className="font-mono text-slate-900 font-semibold">
                            {new Date(del.eta).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
