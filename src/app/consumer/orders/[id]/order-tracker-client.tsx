"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  CheckCircle2,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Star,
  Sparkles,
  Loader2,
  Phone,
  Navigation,
  MapPin,
  Clock,
  RotateCcw,
  XCircle,
  KeyRound,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { MarketProduct } from "@/config/demo-products";

const LeafletMap = dynamic(() => import("@/components/logistics/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs animate-pulse">
      Loading OpenStreetMap Telemetry...
    </div>
  ),
});

export interface StatusHistoryItem {
  status: string;
  timestamp: string;
  note?: string;
}

export interface OrderTrackerProps {
  initialOrder: {
    _id: string;
    orderNumber: string;
    sellerName: string;
    sellerType: string;
    sellerPhone?: string;
    items: Array<{
      product?: string;
      productName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalItemPrice: number;
      qualityGrade?: string;
    }>;
    subtotal: number;
    deliveryFee: number;
    total: number;
    paymentStatus: string;
    paymentMethod: string;
    orderStatus: string;
    statusHistory?: StatusHistoryItem[];
    deliveryOtp?: string;
    otpVerified?: boolean;
    estimatedDeliveryAt?: string;
    deliveredAt?: string;
    cancelledAt?: string;
    deliveryAddress?: {
      recipientName?: string;
      recipientPhone?: string;
      addressLine?: string;
      district?: string;
      state?: string;
      pincode?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    trackingInfo?: {
      trackingNumber: string;
      carrier: string;
      vehicleNumber: string;
      driverName: string;
      driverPhone: string;
      status: string;
      eta: string;
      coldChainTempCelsius?: number;
      currentLocation?: string;
    };
    createdAt: string;
  };
}

// Complete Order Lifecycle sequence for rendering timeline
const LIFECYCLE_STAGES = [
  { key: "PENDING", label: "Order Placed", defaultNote: "Order submitted to grower" },
  { key: "CONFIRMED", label: "Order Confirmed", defaultNote: "Farm produce reserved" },
  { key: "PROCESSING", label: "Being Prepared", defaultNote: "Grading & sorting at farm gate" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup", defaultNote: "Packaged at dispatch bay" },
  { key: "PICKED_UP", label: "Picked Up", defaultNote: "Collected by logistics carrier" },
  { key: "IN_TRANSIT", label: "In Transit", defaultNote: "En route with cold-chain fleet" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", defaultNote: "Driver arriving at doorstep" },
  { key: "DELIVERED", label: "Delivered", defaultNote: "Safely received & verified" },
];

export function OrderTrackerClient({ initialOrder }: OrderTrackerProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [order, setOrder] = useState(initialOrder);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");

  // Live telemetry state from polling
  const [liveLocationText, setLiveLocationText] = useState<string>("Checking live location...");
  const [liveCoords, setLiveCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRoutePolyline, setMapRoutePolyline] = useState<[number, number][]>([]);
  const [carrierInfo, setCarrierInfo] = useState<any>(null);

  // Review state
  const [isReviewing, setIsReviewing] = useState(false);
  const [rating, setRating] = useState(5);
  const [freshnessScore, setFreshnessScore] = useState(5);
  const [packagingScore, setPackagingScore] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Buy Again state
  const [isReordering, setIsReordering] = useState(false);

  const currentStatus = order?.orderStatus || "PENDING";
  // "Buyer cancellation is allowed only before PROCESSING"
  const canCancel = ["PENDING", "CONFIRMED"].includes(currentStatus);
  const isDelivered = currentStatus === "DELIVERED";
  const isCancelled = currentStatus === "CANCELLED";

  // Polling for real-time tracking data
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchTrackingTelemetry() {
      try {
        const res = await fetch(`/api/orders/${order._id}/tracking`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setOrder((prev) => ({
              ...prev,
              orderStatus: data.orderStatus,
              statusHistory: data.statusHistory || prev.statusHistory,
              deliveryOtp: data.deliveryOtp || prev.deliveryOtp,
              otpVerified: data.otpVerified ?? prev.otpVerified,
              deliveredAt: data.deliveredAt || prev.deliveredAt,
              cancelledAt: data.cancelledAt || prev.cancelledAt,
            }));

            if (data.carrierInfo) {
              setCarrierInfo(data.carrierInfo);
            }
            if (data.currentLocation) {
              setLiveCoords({
                latitude: data.currentLocation.latitude,
                longitude: data.currentLocation.longitude,
              });
            }
            if (data.lastLocationUpdate) {
              setLiveLocationText(data.lastLocationUpdate);
            }
            if (Array.isArray(data.route) && data.route.length > 0) {
              setMapRoutePolyline(data.route);
            }
          }
        }
      } catch (err) {
        console.warn("Telemetry polling error:", err);
      }
    }

    // Initial fetch
    fetchTrackingTelemetry();

    // Poll every 15s if not in terminal state
    if (!isDelivered && !isCancelled) {
      intervalId = setInterval(fetchTrackingTelemetry, 15000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [order._id, isDelivered, isCancelled]);

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    setCancelMessage("");

    try {
      const res = await fetch(`/api/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          reason: cancelReason || "Cancelled by consumer before processing",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to cancel order");
      }

      setOrder((prev) => ({
        ...prev,
        orderStatus: "CANCELLED",
        paymentStatus: "REFUNDED",
        statusHistory: [
          ...(prev.statusHistory || []),
          {
            status: "CANCELLED",
            timestamp: new Date().toISOString(),
            note: cancelReason || "Cancelled by consumer before processing",
          },
        ],
      }));
      setShowCancelDialog(false);
      setCancelMessage("Order cancelled successfully. Held payment has been refunded.");
    } catch (err: unknown) {
      setCancelMessage((err as Error).message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewing(true);
    setReviewError("");

    try {
      const firstProduct = order.items?.[0]?.product || "";
      const res = await fetch("/api/consumer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: firstProduct,
          orderId: order._id,
          rating,
          freshnessScore,
          packagingScore,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      setReviewSubmitted(true);
    } catch (err: unknown) {
      setReviewError((err as Error).message);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleBuyAgain = async () => {
    setIsReordering(true);
    try {
      let added = 0;
      for (const item of order.items) {
        if (!item.product) continue;
        const res = await fetch(`/api/products/${item.product}`);
        if (res.ok) {
          const data = await res.json();
          const prod = data.product;
          if (prod && prod.status !== "ARCHIVED" && prod.availableQuantity > 0) {
            addItem(
              prod as unknown as MarketProduct,
              Math.min(item.quantity, prod.availableQuantity)
            );
            added++;
          }
        }
      }
      if (added > 0) {
        router.push("/consumer/cart");
      }
    } finally {
      setIsReordering(false);
    }
  };

  // Build Status History Map for fast lookup
  const historyMap = new Map<string, { timestamp: string; note: string }>();
  (order.statusHistory || []).forEach((h) => {
    historyMap.set(h.status, {
      timestamp: h.timestamp,
      note: h.note || "",
    });
  });

  // Pickup coordinates (Odisha farm cluster default if not set)
  const pickupCoords = {
    latitude: 20.4625,
    longitude: 85.8828,
  };

  // Destination coordinates (from order deliveryAddress)
  const destCoords = {
    latitude: order.deliveryAddress?.coordinates?.latitude || 20.2961,
    longitude: order.deliveryAddress?.coordinates?.longitude || 85.8245,
  };

  // Lifecycle Index
  const currentStageIndex = LIFECYCLE_STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg text-slate-900">
              #{order.orderNumber}
            </span>
            <Badge
              variant={isDelivered ? "default" : isCancelled ? "destructive" : "secondary"}
              className={`text-[10px] font-bold uppercase ${
                ["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(currentStatus)
                  ? "bg-emerald-700 text-white"
                  : ""
              }`}
            >
              {currentStatus.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN")} • Grower:{" "}
            <span className="font-semibold text-slate-800">{order.sellerName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
            >
              Cancel Order
            </Button>
          )}

          {isDelivered && (
            <Button
              onClick={handleBuyAgain}
              disabled={isReordering}
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold gap-1.5"
            >
              {isReordering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              <span>Buy Again</span>
            </Button>
          )}
        </div>
      </div>

      {cancelMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{cancelMessage}</span>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Cancel Your Order?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You can cancel this order before farm packaging begins. Any payment held in KISANOVA escrow will be instantly refunded.
            </p>
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700">Reason for cancellation (optional)</label>
              <input
                type="text"
                placeholder="e.g., Change of delivery address, ordered by mistake"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-emerald-600"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="flex-1 rounded-xl text-xs font-bold"
              >
                {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Confirm Cancellation
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 rounded-xl text-xs"
              >
                Keep Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation OTP Banner (When Out for Delivery or In Transit) */}
      {order.deliveryOtp && !isDelivered && !isCancelled && (
        <div className="rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50/60 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <KeyRound className="h-5 w-5 text-amber-700" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Doorstep Delivery Confirmation Code
              </span>
              <p className="text-xs text-slate-700">
                Share this 4-digit code with your delivery driver upon produce handover.
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-amber-300 rounded-2xl px-5 py-2 text-center shadow-xs self-start sm:self-auto">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Your OTP</span>
            <span className="font-mono text-xl font-black text-amber-900 tracking-widest">
              {order.deliveryOtp}
            </span>
          </div>
        </div>
      )}

      {/* Assigned Delivery Partner Card */}
      {carrierInfo?.driverName && !isCancelled && (
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/50 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Assigned Delivery Partner
                </span>
                {carrierInfo.vehicleType && (
                  <Badge variant="outline" className="text-[9px] font-bold bg-white text-blue-800 border-blue-300">
                    {carrierInfo.vehicleType}
                  </Badge>
                )}
              </div>
              <h4 className="font-black text-slate-900 text-sm sm:text-base">{carrierInfo.driverName}</h4>
              <p className="text-xs text-slate-600 font-mono">
                Vehicle: {carrierInfo.vehicleNumber || "Verified Fleet"} • Tracking: {carrierInfo.trackingNumber}
              </p>
            </div>
          </div>

          {carrierInfo.driverPhone && (
            <a href={`tel:${carrierInfo.driverPhone}`} className="self-start sm:self-auto">
              <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 shadow-2xs">
                <Phone className="h-3.5 w-3.5" />
                <span>Call Partner</span>
              </Button>
            </a>
          )}
        </div>
      )}

      {/* Current Status Highlight Banner */}
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>Current Status: {currentStatus.replace(/_/g, " ")}</span>
            </h3>
            <p className="text-xs text-slate-600">
              {isDelivered
                ? "Your fresh produce has arrived and delivery has been confirmed."
                : isCancelled
                ? "This order has been cancelled and funds reversed."
                : currentStatus === "OUT_FOR_DELIVERY"
                ? "Your order is out for delivery to your doorstep."
                : currentStatus === "IN_TRANSIT"
                ? "Your order is on the way via cold-chain transit."
                : "Your order is being prepared and scheduled for dispatch."}
            </p>
          </div>
        </div>

        {order.estimatedDeliveryAt && !isDelivered && !isCancelled && (
          <div className="sm:text-right text-xs">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Estimated Arrival</span>
            <div className="font-bold text-emerald-800">
              {new Date(order.estimatedDeliveryAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}
      </div>

      {/* DYNAMIC TIMELINE (Generated Strictly from MongoDB statusHistory) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-700" />
            <span>Order &amp; Delivery Progress Timeline</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {isCancelled ? "Terminal (Cancelled)" : isDelivered ? "Completed" : "In Progress"}
          </span>
        </div>

        {/* Timeline List */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {isCancelled ? (
            // Cancelled Timeline View
            <>
              {order.statusHistory?.map((entry, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 sm:-left-8 top-0.5 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-rose-100">
                    <XCircle className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-rose-900">{entry.status.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {entry.note && <p className="text-xs text-slate-600">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </>
          ) : (
            // Standard Progression Lifecycle
            LIFECYCLE_STAGES.map((stage, idx) => {
              const historyEntry = historyMap.get(stage.key);
              const isRecorded = !!historyEntry;
              const isCurrent = currentStatus === stage.key;
              const isFuture = !isRecorded && idx > currentStageIndex;

              return (
                <div key={stage.key} className="relative">
                  {/* Icon Indicator */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? "bg-emerald-700 text-white ring-4 ring-emerald-100 shadow-xs"
                        : isRecorded
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isRecorded ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : isCurrent ? (
                      <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    )}
                  </div>

                  {/* Text Description */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-xs ${
                          isCurrent
                            ? "text-emerald-900 text-sm"
                            : isRecorded
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {stage.label}
                      </span>

                      {historyEntry && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(historyEntry.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs ${
                        isCurrent
                          ? "text-slate-700 font-medium"
                          : isRecorded
                          ? "text-slate-600"
                          : "text-slate-400"
                      }`}
                    >
                      {historyEntry?.note || stage.defaultNote}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* REAL OPENSTREETMAP ROUTE & LOCATION TELEMETRY */}
      {!isCancelled && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-emerald-700" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Logistics Telemetry &amp; Route
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-slate-600 border-slate-200 font-normal">
                {liveLocationText}
              </Badge>
            </div>
          </div>

          {/* Map Component */}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <LeafletMap
              origin={{
                name: order.sellerName ? `${order.sellerName} (Farm Cluster)` : "Farm Gate Hub",
                location: pickupCoords,
                stopType: "ORIGIN",
              }}
              destination={{
                name: order.deliveryAddress?.recipientName
                  ? `${order.deliveryAddress.recipientName} (Delivery Address)`
                  : "Doorstep Delivery",
                location: destCoords,
                stopType: "DESTINATION",
              }}
              activeVehicle={
                liveCoords
                  ? {
                      vehicleNumber: carrierInfo?.vehicleNumber || order.trackingInfo?.vehicleNumber || "OD-02-CD-5678",
                      modelName: carrierInfo?.vehicleType ? `${carrierInfo.vehicleType} Express` : "KISANOVA Cold-Chain Fleet",
                      driverName: carrierInfo?.driverName || order.trackingInfo?.driverName || "Fleet Driver",
                      location: liveCoords,
                      temperatureCelsius: order.trackingInfo?.coldChainTempCelsius ?? 16.5,
                    }
                  : undefined
              }
              optimizedPolyline={
                mapRoutePolyline.length > 0
                  ? mapRoutePolyline
                  : [
                      [pickupCoords.latitude, pickupCoords.longitude],
                      [destCoords.latitude, destCoords.longitude],
                    ]
              }
              showTraditional={false}
              showOptimized={true}
              height="280px"
            />
          </div>

          {/* Route Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Farm Origin</span>
              <p className="font-semibold text-slate-900">{order.sellerName}</p>
              <p className="text-slate-500 text-[11px]">Cuttack Farm Gate Cluster, Odisha</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Doorstep Destination</span>
              <p className="font-semibold text-slate-900">{order.deliveryAddress?.recipientName || "Consumer"}</p>
              <p className="text-slate-500 text-[11px]">
                {order.deliveryAddress?.district || "Khordha"}, {order.deliveryAddress?.state || "Odisha"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Cold-Chain Telemetry</span>
              <p className="font-semibold text-slate-900 flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5 text-blue-600" />
                <span>Optimal (16°C - 18°C)</span>
              </p>
              <p className="text-slate-500 text-[11px]">{liveLocationText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Produce List & Receipt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Itemized Harvest Receipt</h3>

          <div className="divide-y divide-slate-100 text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.productName}</div>
                  <p className="text-slate-500">
                    {item.quantity} {item.unit} × ₹{item.unitPrice} •{" "}
                    <span className="text-emerald-700 font-semibold">{item.qualityGrade || "Grade A"}</span>
                  </p>
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {formatCurrency(item.totalItemPrice)}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Produce Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Amount Paid</span>
              <span className="text-emerald-800 text-base">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address & Security info */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Delivery Address</h3>
          <div className="space-y-1 text-slate-600">
            <div className="font-bold text-slate-900">{order.deliveryAddress?.recipientName}</div>
            <p>{order.deliveryAddress?.addressLine}</p>
            <p>
              {order.deliveryAddress?.district}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
            </p>
            <p className="font-mono pt-1 text-slate-500">Phone: {order.deliveryAddress?.recipientPhone}</p>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Escrow Protection Active</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Payment is held safely in KISANOVA escrow until doorstep delivery verification.
            </p>
          </div>
        </div>
      </div>

      {/* Verified Produce Review Form (Only on DELIVERED Orders) */}
      {isDelivered && (
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-base">Rate &amp; Review this Harvest</h3>
            <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold">
              Verified Purchase
            </Badge>
          </div>

          {reviewSubmitted ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="space-y-0.5">
                <div className="font-bold">Thank you for reviewing!</div>
                <p>Your verified rating helps other consumers discover premium smallholder produce.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Share your feedback on harvest freshness, uniform grading, and cold-chain packaging.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Overall Rating (1-5)</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 - Very Fresh)</option>
                    <option value={3}>⭐⭐⭐ (3 - Standard Good)</option>
                    <option value={2}>⭐⭐ (2 - Below Standard)</option>
                    <option value={1}>⭐ (1 - Damaged / Substandard)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Freshness Score (1-5)</label>
                  <select
                    value={freshnessScore}
                    onChange={(e) => setFreshnessScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                  >
                    <option value={5}>5 - Farm gate morning fresh</option>
                    <option value={4}>4 - Crisp &amp; hydrated</option>
                    <option value={3}>3 - Acceptable</option>
                    <option value={2}>2 - Slightly wilted</option>
                    <option value={1}>1 - Stale</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Packaging Score (1-5)</label>
                  <select
                    value={packagingScore}
                    onChange={(e) => setPackagingScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-900"
                  >
                    <option value={5}>5 - Rigid cold-crate jacketed</option>
                    <option value={4}>4 - Neat biodegradable wrap</option>
                    <option value={3}>3 - Standard safe packaging</option>
                    <option value={2}>2 - Minor transit scuffing</option>
                    <option value={1}>1 - Crushed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Review Comments</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Share details regarding taste, shelf-life, and transit condition..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-emerald-600"
                />
              </div>

              {reviewError && <p className="text-rose-600 text-xs">{reviewError}</p>}

              <Button
                type="submit"
                disabled={isReviewing}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold gap-1.5"
              >
                {isReviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                <span>Submit Verified Review</span>
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
