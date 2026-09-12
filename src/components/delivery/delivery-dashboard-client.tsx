"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Truck,
  Bike,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Navigation,
  Power,
  KeyRound,
  RotateCcw,
  Loader2,
  Package,
  Calendar,
  IndianRupee,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { VoiceInputButton } from "@/components/shared/voice-input-button";

const LeafletMap = dynamic(() => import("@/components/logistics/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs animate-pulse">
      Loading OpenStreetMap Telemetry...
    </div>
  ),
});

interface DeliveryItem {
  _id: string;
  deliveryTrackingNumber: string;
  order: {
    _id: string;
    orderNumber: string;
    total: number;
    orderStatus: string;
    deliveryOtp?: string;
    items?: Array<{
      productName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalItemPrice: number;
    }>;
    deliveryAddress?: {
      recipientName?: string;
      recipientPhone?: string;
      addressLine?: string;
      district?: string;
      state?: string;
    };
  };
  pickupLocation: {
    name: string;
    address: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
    contactPhone: string;
  };
  destination: {
    name: string;
    address: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
    contactPhone: string;
  };
  status: string;
  assignmentStatus: string;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  assignedAt?: string;
  actualPickupTime?: string;
  createdAt: string;
}

interface DeliveryPartnerDashboardProps {
  initialData?: {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
    };
    profile: {
      _id: string;
      fullName: string;
      phone: string;
      vehicleType: string;
      vehicleNumber: string;
      vehicleCapacityKg: number;
      verificationStatus: string;
      isOnline: boolean;
      isAvailableForAssignment: boolean;
      serviceArea?: { city: string; radiusKm: number };
      statistics?: {
        completedDeliveries: number;
        averageDeliveryTimeMinutes: number;
        rating: number;
      };
      currentLocation?: {
        latitude: number;
        longitude: number;
        accuracy: number;
        updatedAt: string;
      };
    } | null;
    activeDelivery: DeliveryItem | null;
    pendingAssignments: DeliveryItem[];
    stats: {
      todayDeliveries: number;
      activeTrips: number;
      completedDeliveries: number;
      rating: number;
      averageDeliveryTimeMinutes: number;
      estimatedEarningsToday: number;
    };
  };
}

export default function DeliveryDashboardClient({ initialData }: DeliveryPartnerDashboardProps) {
  const { t } = useLanguage();
  const [data, setData] = useState(initialData || null);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "OFFERS" | "HISTORY" | "PROFILE">("ACTIVE");

  const [isOnline, setIsOnline] = useState(initialData?.profile?.isOnline || false);
  const [dutyLoading, setDutyLoading] = useState(false);

  // Real Browser Geolocation State
  const [gpsStatus, setGpsStatus] = useState<"IDLE" | "TRACKING" | "DENIED" | "UNAVAILABLE">("IDLE");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [lastGpsPing, setLastGpsPing] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Status progression state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectDeliveryId, setRejectDeliveryId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [notification, setNotification] = useState<string | null>(null);
  const [availableDispatches, setAvailableDispatches] = useState<DeliveryItem[]>([]);
  const [refreshingOffers, setRefreshingOffers] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashRes, availRes] = await Promise.all([
        fetch("/api/delivery/dashboard"),
        fetch("/api/delivery/assignments?filter=AVAILABLE"),
      ]);
      const result = await dashRes.json();
      if (result.success) {
        setData(result.data);
        setIsOnline(result.data.profile?.isOnline || false);
      }
      const availResult = await availRes.json();
      if (availResult.success && Array.isArray(availResult.deliveries)) {
        setAvailableDispatches(availResult.deliveries);
      }
    } catch (err) {
      console.error("Failed to refresh delivery dashboard:", err);
    }
  }, []);

  const handleManualRefresh = async () => {
    setRefreshingOffers(true);
    await fetchDashboardData();
    setRefreshingOffers(false);
  };

  // Toggle Online/Offline duty
  const handleToggleDuty = async () => {
    if (!data?.profile) return;
    if (data.profile.verificationStatus !== "VERIFIED") {
      alert(`Your account is currently ${data.profile.verificationStatus}. You can only go online after Admin verification.`);
      return;
    }

    setDutyLoading(true);
    const newStatus = !isOnline;
    try {
      const res = await fetch("/api/delivery/duty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setIsOnline(newStatus);
        setNotification(newStatus ? "You are now ONLINE. Searching for nearby dispatches." : "You are now OFFLINE.");
        setTimeout(() => setNotification(null), 3500);
      } else {
        alert(result.message || "Failed to update duty status");
      }
    } catch {
      alert("Network error updating duty status");
    } finally {
      setDutyLoading(false);
    }
  };

  // REAL Browser Geolocation Tracking Hook
  useEffect(() => {
    if (!isOnline) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsStatus("IDLE");
      return;
    }

    if (!("geolocation" in navigator)) {
      setGpsStatus("UNAVAILABLE");
      return;
    }

    setGpsStatus("TRACKING");

    const onLocationUpdate = async (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setGpsAccuracy(Math.round(accuracy));
      setLastGpsPing(new Date());

      // Throttle: send only if first time or moved > 40 meters
      const last = lastSentCoordsRef.current;
      if (last) {
        const dLat = Math.abs(latitude - last.lat);
        const dLng = Math.abs(longitude - last.lng);
        if (dLat < 0.0004 && dLng < 0.0004) {
          return; // Skip identical ping
        }
      }

      lastSentCoordsRef.current = { lat: latitude, lng: longitude };

      try {
        await fetch("/api/delivery/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
          }),
        });
      } catch (err) {
        console.warn("Location ping ingestion failed:", err);
      }
    };

    const onLocationError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setGpsStatus("DENIED");
      } else {
        setGpsStatus("UNAVAILABLE");
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onLocationUpdate,
      onLocationError,
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOnline]);

  // Handle Accept Assignment
  const handleAcceptAssignment = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    try {
      const res = await fetch(`/api/delivery/assignments/${deliveryId}/accept`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        setNotification("Assignment accepted! Proceed to farm gate pickup.");
        setTimeout(() => setNotification(null), 4000);
        await fetchDashboardData();
        setActiveTab("ACTIVE");
      } else {
        alert(result.message || "Failed to accept assignment");
      }
    } catch {
      alert("Error accepting assignment");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Reject Assignment
  const handleConfirmReject = async () => {
    if (!rejectDeliveryId || !rejectReason.trim()) return;
    setActionLoading(rejectDeliveryId);
    try {
      const res = await fetch(`/api/delivery/assignments/${rejectDeliveryId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setNotification("Assignment rejected. Order returned to unassigned pool.");
        setTimeout(() => setNotification(null), 4000);
        setRejectModalOpen(false);
        setRejectReason("");
        setRejectDeliveryId(null);
        await fetchDashboardData();
      } else {
        alert(result.message || "Failed to reject assignment");
      }
    } catch {
      alert("Error rejecting assignment");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Step Progression (ARRIVED_AT_PICKUP, PICKED_UP, IN_TRANSIT, ARRIVED_AT_DESTINATION, DELIVERED)
  const handleProgressStatus = async (deliveryId: string, nextStatus: string, otp?: string) => {
    setActionLoading(deliveryId);
    setOtpError(null);
    try {
      const payload: { status: string; otpCode?: string } = { status: nextStatus };
      if (otp) payload.otpCode = otp;

      const res = await fetch(`/api/delivery/${deliveryId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        setNotification(`Trip status updated: ${nextStatus}`);
        setTimeout(() => setNotification(null), 3500);
        setOtpInput("");
        await fetchDashboardData();
      } else {
        if (nextStatus === "DELIVERED") {
          setOtpError(result.message || "Invalid OTP code");
        } else {
          alert(result.message || "Failed to update status");
        }
      }
    } catch {
      alert("Network error updating delivery status");
    } finally {
      setActionLoading(null);
    }
  };

  const profile = data?.profile;
  const activeDelivery = data?.activeDelivery;
  const pendingAssignments = data?.pendingAssignments || [];

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20 sm:pb-8">
      {/* Top Header Card */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-slate-900 text-sm truncate">
                  {profile?.fullName || data?.user?.name || "Delivery Partner"}
                </span>
                {profile?.verificationStatus === "VERIFIED" ? (
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                    ✓ Verified
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                    Pending Verification
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {profile?.vehicleType || "Vehicle"} • {profile?.vehicleNumber || "Unregistered"} (Cap: {profile?.vehicleCapacityKg || 40}kg)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher compact />

            {/* Duty Toggle Button */}
            <button
              onClick={handleToggleDuty}
              disabled={dutyLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isOnline
                  ? "bg-emerald-700 text-white hover:bg-emerald-800 ring-2 ring-emerald-400/40"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              <Power className={`h-3.5 w-3.5 ${isOnline ? "animate-pulse" : ""}`} />
              <span>{dutyLoading ? "..." : isOnline ? t("delivery.dutyOnline", "ONLINE") : t("delivery.dutyOffline", "OFFLINE")}</span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Real GPS Status Banner */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                gpsStatus === "TRACKING"
                  ? "bg-emerald-500 animate-ping"
                  : gpsStatus === "DENIED"
                  ? "bg-rose-500"
                  : "bg-slate-300"
              }`}
            />
            <span className="font-semibold text-slate-700">
              {gpsStatus === "TRACKING"
                ? `GPS Active (Accuracy: ~${gpsAccuracy || 10}m)`
                : gpsStatus === "DENIED"
                ? "Location Permission Denied (Enable GPS in browser)"
                : "GPS Idle (Go Online to start location tracking)"}
            </span>
          </div>
          {lastGpsPing && (
            <span className="text-slate-400 text-[10px]">
              Last ping: {lastGpsPing.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {notification && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Verification Alert if not verified */}
        {profile && profile.verificationStatus !== "VERIFIED" && (
          <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <div className="font-bold">Application Pending Review</div>
              <p className="text-[11px] text-amber-800">
                Your profile is submitted and awaiting KISANOVA Admin verification. Once verified, you will be able to go online and receive smart AI dispatches.
              </p>
            </div>
          </div>
        )}

        {/* If no profile yet, link to onboarding */}
        {!profile && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
            <Truck className="h-10 w-10 text-slate-400 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Complete Driver Onboarding</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please register your vehicle and upload your verification documents to receive delivery assignments.
            </p>
            <Link href="/delivery/onboarding">
              <Button className="rounded-xl bg-slate-900 text-white font-bold text-xs px-6 py-2">
                Start Onboarding
              </Button>
            </Link>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
              <span>{t("delivery.todaysDeliveries", "Today's Deliveries")}</span>
              <Package className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {data?.stats?.todayDeliveries || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{t("delivery.completedToday", "Completed today")}</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
              <span>{t("delivery.activeTrip", "Active Trip")}</span>
              <Navigation className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {data?.stats?.activeTrips || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{t("delivery.inTransitNow", "In-transit now")}</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
              <span>{t("delivery.totalDelivered", "Total Delivered")}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {data?.stats?.completedDeliveries || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{t("delivery.lifetimeOrders", "Lifetime orders")}</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
              <span>{t("delivery.todaysEarnings", "Today's Earnings")}</span>
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-800 mt-1">
              ₹{data?.stats?.estimatedEarningsToday || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{t("delivery.estPayout", "Est. payout")}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ACTIVE"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            {t("delivery.activeTrip", "Active Trip")} {activeDelivery ? "•" : ""}
          </button>
          <button
            onClick={() => setActiveTab("OFFERS")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "OFFERS"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <span>{t("delivery.dispatchesOffers", "Dispatches & Offers")}</span>
            {pendingAssignments.length + availableDispatches.length > 0 && (
              <span className="h-4 w-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">
                {pendingAssignments.length + availableDispatches.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("PROFILE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "PROFILE"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            {t("delivery.vehicleProfile", "Vehicle & Profile")}
          </button>
        </div>

        {/* TAB CONTENT: ACTIVE TRIP */}
        {activeTab === "ACTIVE" && (
          <div className="space-y-4">
            {activeDelivery ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Status Bar */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Current Active Dispatch
                    </div>
                    <div className="text-sm font-black flex items-center gap-2">
                      <span>Order #{activeDelivery.order.orderNumber}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[10px]">
                        {activeDelivery.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Total Distance</div>
                    <div className="text-xs font-bold">{activeDelivery.estimatedDistanceKm} km (~{activeDelivery.estimatedDurationMinutes} mins)</div>
                  </div>
                </div>

                {/* Interactive Leaflet Telemetry Map */}
                <div className="p-4 border-b border-slate-100">
                  <LeafletMap
                    origin={{
                      name: activeDelivery.pickupLocation.name,
                      location: {
                        latitude: activeDelivery.pickupLocation.latitude,
                        longitude: activeDelivery.pickupLocation.longitude,
                      },
                      stopType: "FARM_PICKUP",
                    }}
                    destination={{
                      name: activeDelivery.destination.name,
                      location: {
                        latitude: activeDelivery.destination.latitude,
                        longitude: activeDelivery.destination.longitude,
                      },
                      stopType: "DESTINATION",
                    }}
                    height="260px"
                  />
                </div>

                {/* Pickup & Destination Info */}
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pickup details */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          {t("delivery.farmGatePickup", "1. Farm Gate Pickup Point")}
                        </span>
                        <a
                          href={`tel:${activeDelivery.pickupLocation.contactPhone}`}
                          className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{t("delivery.callFarmer", "Call Farmer")}</span>
                        </a>
                      </div>
                      <div className="font-bold text-xs text-slate-900">
                        {activeDelivery.pickupLocation.name}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {activeDelivery.pickupLocation.address}, {activeDelivery.pickupLocation.district}
                      </div>
                    </div>

                    {/* Destination details */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                          {t("delivery.customerDestination", "2. Customer Destination")}
                        </span>
                        <a
                          href={`tel:${activeDelivery.destination.contactPhone}`}
                          className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{t("delivery.callBuyer", "Call Buyer")}</span>
                        </a>
                      </div>
                      <div className="font-bold text-xs text-slate-900">
                        {activeDelivery.destination.name}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {activeDelivery.destination.address}, {activeDelivery.destination.district}
                      </div>
                    </div>
                  </div>

                  {/* Order Items Snapshot */}
                  {activeDelivery.order.items && activeDelivery.order.items.length > 0 && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        {t("delivery.produceCargoLoad", "Produce Cargo Load")}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-800">
                        {activeDelivery.order.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs"
                          >
                            {it.quantity} {it.unit} • {it.productName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STATUS CONTROLLER BUTTONS */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-900 mb-2">
                      {t("delivery.milestoneAction", "Logistics Milestone Action")}
                    </div>

                    {activeDelivery.status === "ASSIGNED" && (
                      <Button
                        onClick={() => handleAcceptAssignment(activeDelivery._id)}
                        disabled={actionLoading === activeDelivery._id}
                        className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs"
                      >
                        {t("delivery.acceptStart", "Accept Assignment & Start")}
                      </Button>
                    )}

                    {activeDelivery.status === "ACCEPTED" && (
                      <Button
                        onClick={() => handleProgressStatus(activeDelivery._id, "ARRIVED_AT_PICKUP")}
                        disabled={actionLoading === activeDelivery._id}
                        className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>{t("delivery.arrivedAtPickup", "I Have Arrived at Farm Gate")}</span>
                      </Button>
                    )}

                    {activeDelivery.status === "ARRIVED_AT_PICKUP" && (
                      <Button
                        onClick={() => handleProgressStatus(activeDelivery._id, "PICKED_UP")}
                        disabled={actionLoading === activeDelivery._id}
                        className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <Package className="h-4 w-4" />
                        <span>{t("delivery.pickedUp", "Confirm Produce Handed Over (Picked Up)")}</span>
                      </Button>
                    )}

                    {activeDelivery.status === "PICKED_UP" && (
                      <Button
                        onClick={() => handleProgressStatus(activeDelivery._id, "IN_TRANSIT")}
                        disabled={actionLoading === activeDelivery._id}
                        className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        <span>{t("delivery.startInTransit", "Start In-Transit Route")}</span>
                      </Button>
                    )}

                    {(activeDelivery.status === "IN_TRANSIT" || activeDelivery.status === "OUT_FOR_DELIVERY") && (
                      <Button
                        onClick={() => handleProgressStatus(activeDelivery._id, "ARRIVED_AT_DESTINATION")}
                        disabled={actionLoading === activeDelivery._id}
                        className="w-full py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 mb-3"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>{t("delivery.arrivedAtDestination", "I Have Reached Customer Address")}</span>
                      </Button>
                    )}

                    {/* PROOF OF DELIVERY OTP PROMPT */}
                    {activeDelivery.status === "ARRIVED_AT_DESTINATION" && (
                      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-3">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                          <KeyRound className="h-4 w-4 text-amber-700" />
                          <span>{t("delivery.proofOfDelivery", "Customer Proof of Delivery (OTP Required)")}</span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          {t("delivery.otpHelp", "Ask the customer for the 6-digit confirmation OTP displayed on their order tracker screen.")}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={6}
                              value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
                              placeholder={t("delivery.otpPlaceholder", "Enter 6-digit OTP")}
                              className="w-48 px-3.5 py-2 pr-10 bg-white border border-amber-300 rounded-xl text-center font-black tracking-widest text-sm focus:ring-2 focus:ring-slate-900"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <VoiceInputButton
                                onTranscript={(txt) => setOtpInput(txt.replace(/[^0-9]/g, "").slice(0, 6))}
                                size="sm"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={() => handleProgressStatus(activeDelivery._id, "DELIVERED", otpInput)}
                            disabled={otpInput.length !== 6 || actionLoading === activeDelivery._id}
                            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
                          >
                            {actionLoading === activeDelivery._id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                            ) : (
                              t("delivery.verifyDeliver", "Verify & Deliver")
                            )}
                          </Button>
                        </div>
                        {otpError && (
                          <div className="text-xs font-bold text-rose-700 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{otpError}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
                <Navigation className="h-10 w-10 text-slate-300 mx-auto" />
                <div className="font-bold text-sm text-slate-900">No Active Trips in Progress</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isOnline
                    ? "You are ONLINE and broadcasting GPS. When a farm dispatch matches your vehicle and location, it will appear here."
                    : "You are currently OFFLINE. Toggle the Online switch at the top right to receive assignments."}
                </p>
                {(pendingAssignments.length > 0 || availableDispatches.length > 0) && (
                  <Button
                    onClick={() => setActiveTab("OFFERS")}
                    className="rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    View {pendingAssignments.length + availableDispatches.length} Available Dispatches
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: DISPATCHES & OFFERS */}
        {activeTab === "OFFERS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Dispatches &amp; Pickup Offers</h3>
                <p className="text-[11px] text-slate-500">
                  AI-matched dispatches and open produce loads waiting for pickup.
                </p>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={refreshingOffers}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <RotateCcw className={`h-3 w-3 ${refreshingOffers ? "animate-spin text-emerald-600" : ""}`} />
                <span>{refreshingOffers ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>

            {/* Direct Assignments (Assigned to this Partner) */}
            {pendingAssignments.length > 0 && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Assigned Specifically to You ({pendingAssignments.length})
                </div>
                {pendingAssignments.map((del) => (
                  <div
                    key={del._id}
                    className="p-4 sm:p-5 rounded-3xl bg-white border border-emerald-300 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-black text-sm text-slate-900">
                        Order #{del.order.orderNumber}
                      </span>
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                        {del.estimatedDistanceKm} km • ~{del.estimatedDurationMinutes} mins
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Pickup Hub</div>
                        <div className="font-bold text-slate-900">{del.pickupLocation.name}</div>
                        <div className="text-[11px] text-slate-500">{del.pickupLocation.district}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Delivery To</div>
                        <div className="font-bold text-slate-900">{del.destination.name}</div>
                        <div className="text-[11px] text-slate-500">{del.destination.district}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setRejectDeliveryId(del._id);
                          setRejectModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
                      >
                        Reject Offer
                      </button>
                      <Button
                        onClick={() => handleAcceptAssignment(del._id)}
                        disabled={actionLoading === del._id}
                        className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs"
                      >
                        {actionLoading === del._id ? "Accepting..." : "Accept Assignment"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Available Open Dispatches (Can be claimed) */}
            {availableDispatches.length > 0 && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Open Produce Dispatches Waiting for Pickup ({availableDispatches.length})
                </div>
                {availableDispatches.map((del) => (
                  <div
                    key={del._id}
                    className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-black text-sm text-slate-900">
                        Dispatch #{del.deliveryTrackingNumber}
                      </span>
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                        {del.estimatedDistanceKm} km • ~{del.estimatedDurationMinutes} mins
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Pickup Hub</div>
                        <div className="font-bold text-slate-900">{del.pickupLocation.name}</div>
                        <div className="text-[11px] text-slate-500">{del.pickupLocation.district}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Destination</div>
                        <div className="font-bold text-slate-900">{del.destination.name}</div>
                        <div className="text-[11px] text-slate-500">{del.destination.district}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        onClick={() => handleAcceptAssignment(del._id)}
                        disabled={actionLoading === del._id}
                        className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                      >
                        <Package className="h-3.5 w-3.5" />
                        <span>{actionLoading === del._id ? "Claiming..." : "Claim & Start Delivery"}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {pendingAssignments.length === 0 && availableDispatches.length === 0 && (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2 text-slate-500 text-xs">
                <Package className="h-8 w-8 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-700">No Dispatches Currently Available</div>
                <p className="max-w-sm mx-auto">
                  Keep your status ONLINE. When a farmer or buyer order in your operating radius is packed, AI will auto-assign it directly to your phone.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: PROFILE & VEHICLE */}
        {activeTab === "PROFILE" && profile && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-slate-900">Driver &amp; Vehicle Record</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] font-bold">Vehicle Class</span>
                <span className="font-bold text-slate-900">{profile.vehicleType}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] font-bold">Registration Plate</span>
                <span className="font-bold text-slate-900">{profile.vehicleNumber}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] font-bold">Payload Capacity</span>
                <span className="font-bold text-slate-900">{profile.vehicleCapacityKg} kg</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] font-bold">Service City &amp; Radius</span>
                <span className="font-bold text-slate-900">
                  {profile.serviceArea?.city || "Bhubaneswar"} ({profile.serviceArea?.radiusKm || 30} km)
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] font-bold">Verification Status</span>
                <span className="font-bold text-emerald-800">{profile.verificationStatus}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] font-bold">Driver Rating</span>
                <span className="font-bold text-slate-900">★ {profile.statistics?.rating || 4.8} / 5.0</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Reject Assignment</h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Please specify the operational reason for rejecting this assignment. The order will be immediately routed to the next best partner.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Reason *
              </label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Vehicle breakdown, puncture, emergency, capacity mismatch..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || actionLoading !== null}
                className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
