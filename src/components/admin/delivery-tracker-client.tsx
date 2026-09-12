"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  AlertCircle,
  Navigation,
  RefreshCw,
  KeyRound,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LeafletMap = dynamic(() => import("@/components/logistics/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[460px] w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs animate-pulse">
      Loading Live OpenStreetMap Telemetry...
    </div>
  ),
});

interface DeliveryTrackerClientProps {
  delivery: any;
}

export default function AdminDeliveryTrackerClient({ delivery: initialDelivery }: DeliveryTrackerClientProps) {
  const [delivery, setDelivery] = useState(initialDelivery);
  const [refreshing, setRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>("");

  const pollDelivery = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/deliveries?id=${delivery._id}`);
      const result = await res.json();
      if (result.success && result.deliveries?.[0]) {
        setDelivery(result.deliveries[0]);
      }
    } catch (err) {
      console.warn("Telemetry refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const calcFreshness = () => {
      const updated = delivery.currentLocation?.updatedAt
        ? new Date(delivery.currentLocation.updatedAt).getTime()
        : 0;
      if (!updated) {
        setTimeAgo("No GPS location recorded yet");
        return;
      }
      const sec = Math.max(0, Math.round((Date.now() - updated) / 1000));
      if (sec < 60) {
        setTimeAgo(`Live — updated ${sec} seconds ago`);
      } else if (sec < 3600) {
        setTimeAgo(`Recent — updated ${Math.floor(sec / 60)} minutes ago`);
      } else {
        setTimeAgo(`Stale — updated ${Math.floor(sec / 3600)} hours ago`);
      }
    };

    calcFreshness();
    const interval = setInterval(calcFreshness, 10000);
    return () => clearInterval(interval);
  }, [delivery]);

  const partner = delivery.assignedPartner;
  const isStale =
    delivery.currentLocation?.updatedAt &&
    Date.now() - new Date(delivery.currentLocation.updatedAt).getTime() > 600000;

  return (
    <div className="space-y-4">
      {/* Title Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-900">
              Live Dispatch #{delivery.deliveryTrackingNumber}
            </h1>
            <Badge className="bg-slate-900 text-emerald-400 text-xs font-bold py-0.5 px-2">
              {delivery.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Order #{delivery.order?.orderNumber} • Linked with real device GPS telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={pollDelivery}
            disabled={refreshing}
            className="rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh GPS</span>
          </Button>
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Pane: Map */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  !delivery.currentLocation?.latitude
                    ? "bg-slate-300"
                    : isStale
                    ? "bg-amber-500"
                    : "bg-emerald-500 animate-ping"
                }`}
              />
              <span className="text-xs font-bold text-slate-800">{timeAgo}</span>
            </div>
            <div className="text-xs font-bold text-slate-500">
              Est. Distance: {delivery.estimatedDistanceKm} km • ~{delivery.estimatedDurationMinutes} mins
            </div>
          </div>

          <LeafletMap
            origin={{
              name: delivery.pickupLocation.name,
              location: {
                latitude: delivery.pickupLocation.latitude,
                longitude: delivery.pickupLocation.longitude,
              },
              stopType: "FARM_PICKUP",
            }}
            destination={{
              name: delivery.destination.name,
              location: {
                latitude: delivery.destination.latitude,
                longitude: delivery.destination.longitude,
              },
              stopType: "DESTINATION",
            }}
            activeVehicle={
              delivery.currentLocation?.latitude && delivery.currentLocation?.longitude
                ? {
                    vehicleNumber: delivery.driverName || "Delivery Partner",
                    driverName: delivery.driverName,
                    location: {
                      latitude: delivery.currentLocation.latitude,
                      longitude: delivery.currentLocation.longitude,
                    },
                    status: delivery.status,
                  }
                : undefined
            }
            height="460px"
          />

          {/* Coordinates readout */}
          {delivery.currentLocation?.latitude && (
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <span>
                Coordinates: {delivery.currentLocation.latitude.toFixed(4)}° N, {delivery.currentLocation.longitude.toFixed(4)}° E
              </span>
              <span>Accuracy: ±{delivery.currentLocation.accuracy || 10} m</span>
            </div>
          )}
        </div>

        {/* Right Pane: Sidebar */}
        <div className="space-y-4">
          {/* Driver details card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Assigned Transporter
            </div>

            {partner || delivery.driverName ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">
                      {partner?.name || delivery.driverName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {delivery.driverPhone || partner?.phone || "No phone listed"}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-bold">Assignment Method</span>
                    <span className="font-bold text-slate-800">
                      {delivery.assignmentHistory?.[0]?.assignmentMethod || "ADMIN_MANUAL"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-bold">AI Confidence</span>
                    <span className="font-bold text-emerald-800">
                      {delivery.assignmentHistory?.[0]?.aiConfidence
                        ? `${Math.round(delivery.assignmentHistory[0].aiConfidence * 100)}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">No partner assigned yet.</div>
            )}
          </div>

          {/* Pickup & Destination */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Route Locations
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Pickup</span>
              <div className="font-bold text-slate-900">{delivery.pickupLocation.name}</div>
              <div className="text-[11px] text-slate-600">
                {delivery.pickupLocation.address}, {delivery.pickupLocation.district}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-800">Destination</span>
              <div className="font-bold text-slate-900">{delivery.destination.name}</div>
              <div className="text-[11px] text-slate-600">
                {delivery.destination.address}, {delivery.destination.district}
              </div>
            </div>
          </div>

          {/* Timeline / Status History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Audit Milestone History
            </div>

            <div className="space-y-3 text-xs">
              {delivery.statusHistory && delivery.statusHistory.length > 0 ? (
                delivery.statusHistory.map((sh: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-slate-900 mt-1.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">{sh.status.replace(/_/g, " ")}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(sh.timestamp).toLocaleString()} • {sh.changedByRole}
                      </div>
                      {sh.note && <div className="text-[11px] text-slate-600 mt-0.5">{sh.note}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs">No status events recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
