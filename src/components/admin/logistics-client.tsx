"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Truck,
  Clock,
  TrendingDown,
  Navigation,
  ShieldCheck,
  Fuel,
  Leaf,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { RouteComparisonResult } from "@/lib/route-optimizer";

// SSR-disabled dynamic Leaflet map import
const LeafletMap = dynamic(() => import("@/components/logistics/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[460px] w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs animate-pulse">
      Loading OpenStreetMap Leaflet Engine...
    </div>
  ),
});

export interface AdminLogisticsClientProps {
  initialStats: {
    pendingDeliveriesCount: number;
    activeDeliveriesCount: number;
    completedDeliveriesCount: number;
    totalVehiclesCount: number;
    activeVehiclesCount: number;
    fleetUtilizationPercent: number;
    totalDistanceCoveredKm: number;
    totalOptimizedCostSavedInr: number;
    co2EmissionsAvoidedKg: number;
  };
  initialComparison: RouteComparisonResult;
  initialVehicles: Array<{
    _id: string;
    registrationNumber: string;
    vehicleClass: string;
    modelName: string;
    payloadCapacityKg: number;
    fuelType: string;
    isRefrigerated: boolean;
    driverName: string;
    driverPhone: string;
    status: string;
    baseHub: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
    };
  }>;
  initialDeliveries: Array<{
    _id: string;
    deliveryTrackingNumber: string;
    pickupLocation: { name: string; district: string; state: string };
    destination: { name: string; district: string; state: string };
    vehicle?: { registrationNumber: string; modelName: string } | null;
    driverName?: string;
    driverPhone?: string;
    status: string;
    estimatedDistanceKm: number;
    estimatedDurationMinutes: number;
    order?: { orderNumber: string; total: number; orderStatus: string } | null;
  }>;
  defaultTab?: "OPTIMIZER" | "DELIVERIES" | "VEHICLES";
}

export default function AdminLogisticsClient({
  initialStats,
  initialComparison,
  initialVehicles,
  initialDeliveries,
  defaultTab = "OPTIMIZER",
}: AdminLogisticsClientProps) {
  const [activeTab, setActiveTab] = useState<"OPTIMIZER" | "DELIVERIES" | "VEHICLES">(defaultTab);
  const [stats] = useState(initialStats);
  const [comparison, setComparison] = useState(initialComparison);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [deliveries, setDeliveries] = useState(initialDeliveries);

  // Map controls
  const [showTraditional, setShowTraditional] = useState(true);
  const [showOptimized, setShowOptimized] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Vehicle form state
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: "",
    modelName: "Tata Ace Gold",
    vehicleClass: "TATA_ACE",
    payloadCapacityKg: 1200,
    fuelType: "DIESEL",
    isRefrigerated: true,
    driverName: "",
    driverPhone: "",
    baseHub: "Nashik Central Agri Logistics Depot",
  });

  // Re-run route optimization
  const handleReoptimize = async (saveToDb = false) => {
    setIsOptimizing(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/route-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveToDb }),
      });
      const data = await res.json();
      if (data.success && data.comparison) {
        setComparison(data.comparison);
        if (saveToDb) {
          setSaveSuccessMsg("✓ Optimized route persisted to fleet active dispatch database!");
          setTimeout(() => setSaveSuccessMsg(null), 5000);
        }
      }
    } catch (err) {
      console.error("Optimization failed:", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Add new vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.registrationNumber || !newVehicle.driverName || !newVehicle.driverPhone) return;

    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVehicle),
      });
      const data = await res.json();
      if (data.success && data.vehicle) {
        setVehicles((prev) => [data.vehicle, ...prev]);
        setShowAddVehicleModal(false);
        setNewVehicle({
          registrationNumber: "",
          modelName: "Tata Ace Gold",
          vehicleClass: "TATA_ACE",
          payloadCapacityKg: 1200,
          fuelType: "DIESEL",
          isRefrigerated: true,
          driverName: "",
          driverPhone: "",
          baseHub: "Nashik Central Agri Logistics Depot",
        });
      }
    } catch (err) {
      console.error("Failed to create vehicle:", err);
    }
  };

  // Advance delivery status
  const handleAdvanceDelivery = async (deliveryId: string, currentStatus: string) => {
    let nextStatus = "ASSIGNED";
    if (currentStatus === "PENDING_ASSIGNMENT") nextStatus = "ASSIGNED";
    else if (currentStatus === "ASSIGNED") nextStatus = "IN_TRANSIT";
    else if (currentStatus === "IN_TRANSIT") nextStatus = "DELIVERED";
    else return;

    try {
      const res = await fetch(`/api/admin/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          telemetry: {
            latitude: 19.452,
            longitude: 73.342,
            temperatureCelsius: 16.2,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.delivery) {
        setDeliveries((prev) =>
          prev.map((d) => (d._id === deliveryId ? { ...d, status: nextStatus } : d))
        );
      }
    } catch (err) {
      console.error("Failed to update delivery status:", err);
    }
  };

  // Toggle vehicle status
  const handleToggleVehicleStatus = async (vehicleId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE";
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setVehicles((prev) =>
          prev.map((v) => (v._id === vehicleId ? { ...v, status: nextStatus } : v))
        );
      }
    } catch (err) {
      console.error("Failed to toggle vehicle status:", err);
    }
  };

  const originStop = comparison.optimized.stops[0];
  const destStop = comparison.optimized.stops[comparison.optimized.stops.length - 1];
  const pickupStops = comparison.optimized.stops.slice(1, -1);

  return (
    <div className="space-y-6">
      {/* 4 Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Dispatches
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.activeDeliveriesCount}
            <span className="text-xs font-normal text-slate-500 ml-1.5">in cold-chain transit</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-700 font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>{stats.pendingDeliveriesCount} pending assignment</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Fleet Utilization
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {stats.fleetUtilizationPercent}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.activeVehiclesCount} of {stats.totalVehiclesCount} commercial vehicles deployed
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Distance Saved (MVP)
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {comparison.savings.distanceSavedKm} km
            <span className="text-xs font-bold text-emerald-600 ml-1.5">
              (-{comparison.savings.percentageDistanceSaved}%)
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Nearest-Neighbor farm consolidation
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Fuel &amp; Carbon Savings
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Fuel className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(comparison.savings.costSavedInr)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-700 font-semibold">
            <Leaf className="h-3 w-3" />
            <span>{comparison.savings.co2EmissionsSavedKg} kg CO₂ avoided</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-4 py-2 gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab("OPTIMIZER")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "OPTIMIZER"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Navigation className="h-3.5 w-3.5" />
          <span>Route Optimizer &amp; Map</span>
        </button>

        <button
          onClick={() => setActiveTab("DELIVERIES")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "DELIVERIES"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Delivery Dispatches ({deliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("VEHICLES")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "VEHICLES"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Truck className="h-3.5 w-3.5" />
          <span>Fleet Vehicles ({vehicles.length})</span>
        </button>
      </div>

      {/* TAB 1: ROUTE OPTIMIZER & SIMULATOR */}
      {activeTab === "OPTIMIZER" && (
        <div className="space-y-6">
          {/* Algorithm Disclosure Banner */}
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                <span>Deterministic Heuristic Optimization Engine (O(N²))</span>
                <Badge className="bg-emerald-200 text-emerald-900 border-none font-bold text-[10px]">
                  MVP Production Ready
                </Badge>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                <strong>Algorithm Disclosure:</strong> The multi-stop farm pickup sequence is
                computed using a deterministic <strong>Nearest-Neighbor Greedy Heuristic</strong>.
                At each stage, the vehicle navigates to the closest unvisited agricultural collection
                point. While the Travelling Salesperson Problem (TSP) is NP-hard, this heuristic
                delivers immediate <strong>{comparison.savings.percentageDistanceSaved}% route reduction</strong> without
                combinatorial latency.
              </p>
            </div>
          </div>

          {/* Interactive Map & Route Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Column (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Live Agricultural Corridor Map</span>
                      <Badge className="bg-slate-100 text-slate-700 font-mono text-[10px]">
                        OpenStreetMap
                      </Badge>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Nashik Horticultural Belt → Vashi Wholesale APMC Terminal
                    </p>
                  </div>

                  {/* Route Toggles */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTraditional(!showTraditional)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        showTraditional
                          ? "border-slate-400 bg-slate-100 text-slate-700"
                          : "border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <span className="h-2 w-4 border-b-2 border-dashed border-slate-500" />
                      <span>Traditional</span>
                    </button>

                    <button
                      onClick={() => setShowOptimized(!showOptimized)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        showOptimized
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span>Optimized</span>
                    </button>
                  </div>
                </div>

                {/* Leaflet Map */}
                <LeafletMap
                  origin={originStop}
                  pickups={pickupStops}
                  destination={destStop}
                  traditionalPolyline={comparison.traditional.polyline}
                  optimizedPolyline={comparison.optimized.polyline}
                  activeVehicle={{
                    vehicleNumber: "MH-15-EG-4921",
                    modelName: "Tata Ace Cold-Chain",
                    driverName: "Santosh Gavit",
                    location: { latitude: 20.082, longitude: 73.842 },
                    temperatureCelsius: 16.4,
                  }}
                  showTraditional={showTraditional}
                  showOptimized={showOptimized}
                  height="480px"
                />

                {/* Map Legend */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-[11px] text-slate-600 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-blue-600" /> Origin Depot
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-emerald-600" /> Farm Gate Pickups (P1–P4)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-red-600" /> Wholesale Destination
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-amber-500" /> Live Reefer Truck
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReoptimize(true)}
                      disabled={isOptimizing}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isOptimizing ? "animate-spin" : ""}`} />
                      <span>{isOptimizing ? "Optimizing..." : "Save Route to Fleet"}</span>
                    </Button>
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold text-center">
                    {saveSuccessMsg}
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Side Panel (1 col) */}
            <div className="space-y-4">
              {/* Route Comparison Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Route Performance Delta
                  </h3>
                  <Badge className="bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Simulated Telemetry
                  </Badge>
                </div>

                {/* Metrics Table */}
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Traditional (Arbitrary Order):</span>
                      <span className="font-mono font-bold text-slate-700">
                        {comparison.traditional.totalDistanceKm} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Estimated Duration:</span>
                      <span className="font-mono text-slate-700">
                        {Math.floor(comparison.traditional.estimatedDurationMinutes / 60)}h{" "}
                        {comparison.traditional.estimatedDurationMinutes % 60}m
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Estimated Fuel Cost:</span>
                      <span className="font-mono text-slate-700">
                        {formatCurrency(comparison.traditional.estimatedFuelCostInr)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-800 font-bold">Optimized (Nearest-Neighbor):</span>
                      <span className="font-mono font-black text-emerald-800">
                        {comparison.optimized.totalDistanceKm} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-700 font-medium">Optimized Duration:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {Math.floor(comparison.optimized.estimatedDurationMinutes / 60)}h{" "}
                        {comparison.optimized.estimatedDurationMinutes % 60}m
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-700 font-medium">Optimized Fuel Cost:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {formatCurrency(comparison.optimized.estimatedFuelCostInr)}
                      </span>
                    </div>
                  </div>

                  {/* Savings Highlight Box */}
                  <div className="rounded-xl bg-slate-900 text-white p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Distance Reduction:</span>
                      <span className="font-black text-emerald-400 text-sm">
                        -{comparison.savings.distanceSavedKm} km ({comparison.savings.percentageDistanceSaved}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Driver Transit Time Saved:</span>
                      <span className="font-bold text-emerald-300">
                        {comparison.savings.durationSavedMinutes} minutes
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Fuel Expenditure Saved:</span>
                      <span className="font-black text-emerald-400 text-sm">
                        {formatCurrency(comparison.savings.costSavedInr)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ordered Stop Sequence */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Optimized Pickup Sequence:
                  </h4>
                  <div className="space-y-2 text-xs">
                    {comparison.optimized.stops.map((stop, index) => (
                      <div
                        key={stop.id || index}
                        className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <span className="h-5 w-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {index === 0
                            ? "🏛️"
                            : index === comparison.optimized.stops.length - 1
                            ? "🏁"
                            : index}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 truncate">{stop.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {stop.stopType} {stop.produceLoadKg ? `• ${stop.produceLoadKg} kg` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERIES MANAGEMENT */}
      {activeTab === "DELIVERIES" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delivery Dispatch Management</h3>
                <p className="text-xs text-slate-500">
                  Assign active vehicles, track dispatches, and synchronize order lifecycle
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 font-bold text-xs">
                {deliveries.length} Total Dispatches
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Tracking #</th>
                    <th className="p-3">Associated Order</th>
                    <th className="p-3">Pickup Source</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Assigned Vehicle</th>
                    <th className="p-3">Distance / Duration</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {d.deliveryTrackingNumber}
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        {d.order?.orderNumber || "Direct Agritech Batch"}
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="font-semibold">{d.pickupLocation?.name}</div>
                        <div className="text-[10px] text-slate-400">{d.pickupLocation?.district}</div>
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="font-semibold">{d.destination?.name}</div>
                        <div className="text-[10px] text-slate-400">{d.destination?.district}</div>
                      </td>
                      <td className="p-3">
                        {d.vehicle ? (
                          <div>
                            <span className="font-bold text-slate-800">
                              {d.vehicle.registrationNumber}
                            </span>
                            <div className="text-[10px] text-slate-400">{d.driverName}</div>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-bold">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-mono">
                        {d.estimatedDistanceKm} km ({Math.round(d.estimatedDurationMinutes / 60)}h)
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            d.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800 border-none font-bold"
                              : d.status === "IN_TRANSIT"
                              ? "bg-blue-100 text-blue-800 border-none font-bold"
                              : d.status === "ASSIGNED"
                              ? "bg-amber-100 text-amber-800 border-none font-bold"
                              : "bg-slate-100 text-slate-700 border-none font-bold"
                          }
                        >
                          {d.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {d.status !== "DELIVERED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdvanceDelivery(d._id, d.status)}
                            className="text-xs h-7 rounded-lg border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
                          >
                            {d.status === "PENDING_ASSIGNMENT"
                              ? "Assign"
                              : d.status === "ASSIGNED"
                              ? "Start Transit"
                              : "Mark Delivered"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FLEET VEHICLES */}
      {activeTab === "VEHICLES" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Commercial Fleet Registry</h3>
                <p className="text-xs text-slate-500">
                  Manage commercial vehicles, reefer cold-chain status, payload capacity, and drivers
                </p>
              </div>
              <Button
                onClick={() => setShowAddVehicleModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Fleet Vehicle</span>
              </Button>
            </div>

            {/* Vehicles Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Reg. Number</th>
                    <th className="p-3">Vehicle Model &amp; Class</th>
                    <th className="p-3">Capacity</th>
                    <th className="p-3">Cold Chain</th>
                    <th className="p-3">Assigned Driver</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {v.registrationNumber}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{v.modelName}</div>
                        <div className="text-[10px] text-slate-400">{v.vehicleClass}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700 font-mono">
                        {v.payloadCapacityKg} kg
                      </td>
                      <td className="p-3">
                        {v.isRefrigerated ? (
                          <Badge className="bg-blue-100 text-blue-800 font-bold border-none text-[10px]">
                            ❄️ Refrigerated (12-16°C)
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 font-bold border-none text-[10px]">
                            Ambient Freight
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{v.driverName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{v.driverPhone}</div>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            v.status === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-800 font-bold border-none"
                              : v.status === "ON_TRIP"
                              ? "bg-amber-100 text-amber-800 font-bold border-none"
                              : "bg-red-100 text-red-800 font-bold border-none"
                          }
                        >
                          {v.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleVehicleStatus(v._id, v.status)}
                          className="text-[11px] h-7 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                        >
                          {v.status === "AVAILABLE" ? "Set Maintenance" : "Set Available"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Vehicle Modal Form */}
          {showAddVehicleModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Add New Commercial Vehicle</h3>
                  <button
                    onClick={() => setShowAddVehicleModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Registration Number:
                    </label>
                    <Input
                      placeholder="e.g. MH-15-EG-8921"
                      value={newVehicle.registrationNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewVehicle({ ...newVehicle, registrationNumber: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Model Name:</label>
                      <Input
                        value={newVehicle.modelName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewVehicle({ ...newVehicle, modelName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Capacity (kg):
                      </label>
                      <Input
                        type="number"
                        value={newVehicle.payloadCapacityKg}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewVehicle({
                            ...newVehicle,
                            payloadCapacityKg: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Driver Name:</label>
                      <Input
                        placeholder="Driver Name"
                        value={newVehicle.driverName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewVehicle({ ...newVehicle, driverName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Driver Phone:</label>
                      <Input
                        placeholder="Phone Number"
                        value={newVehicle.driverPhone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewVehicle({ ...newVehicle, driverPhone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isRefrigerated"
                      checked={newVehicle.isRefrigerated}
                      onChange={(e) =>
                        setNewVehicle({ ...newVehicle, isRefrigerated: e.target.checked })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="isRefrigerated" className="font-semibold text-slate-800">
                      Cold-Chain Reefer Unit Equipped (Temperature Controlled)
                    </label>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
                    >
                      Register Vehicle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddVehicleModal(false)}
                      className="rounded-xl text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
