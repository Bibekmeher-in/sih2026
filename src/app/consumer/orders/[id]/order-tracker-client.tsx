"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const LeafletMap = dynamic(() => import("@/components/logistics/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs animate-pulse">
      Loading OpenStreetMap Telemetry...
    </div>
  ),
});

interface OrderTrackerProps {
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
    }>;
    subtotal: number;
    deliveryFee: number;
    total: number;
    paymentStatus: string;
    paymentMethod: string;
    orderStatus: string;
    deliveryAddress?: {
      recipientName?: string;
      recipientPhone?: string;
      addressLine?: string;
      district?: string;
      state?: string;
      pincode?: string;
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

export function OrderTrackerClient({ initialOrder }: OrderTrackerProps) {
  const [order, setOrder] = useState(initialOrder);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");

  // Review state
  const [isReviewing, setIsReviewing] = useState(false);
  const [rating, setRating] = useState(5);
  const [freshnessScore, setFreshnessScore] = useState(5);
  const [packagingScore, setPackagingScore] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const canCancel = ["PENDING", "CONFIRMED"].includes(order.orderStatus);
  const isDelivered = order.orderStatus === "DELIVERED";
  const isCancelled = order.orderStatus === "CANCELLED";

  // Visual Stepper stages: Order confirmed -> Preparing -> Pickup -> In transit -> Delivered
  const stages = [
    { key: "CONFIRMED", label: "Order confirmed", desc: "Farm gate order accepted" },
    { key: "PROCESSING", label: "Preparing", desc: "Harvested, sorted & packaged" },
    { key: "PICKUP", label: "Pickup", desc: "Collected at farm dispatch bay" },
    { key: "IN_TRANSIT", label: "In transit", desc: "Cold-chain fleet highway transit" },
    { key: "DELIVERED", label: "Delivered", desc: "Verified doorstep handover" },
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case "PENDING":
      case "CONFIRMED":
        return 0;
      case "PROCESSING":
        return 1;
      case "READY_FOR_PICKUP":
      case "ASSIGNED_FOR_DELIVERY":
        return 2;
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return -1;
    }
  };

  const currentStageIndex = getStageIndex(order.orderStatus);

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    setCancelMessage("");

    try {
      const res = await fetch(`/api/consumer/orders/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Customer cancelled before dispatch" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to cancel order");
      }

      setOrder((prev) => ({
        ...prev,
        orderStatus: "CANCELLED",
        paymentStatus: "REFUNDED",
      }));
      setShowCancelDialog(false);
      setCancelMessage("Order cancelled successfully. Refund will be processed within 3-5 business days.");
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

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg text-slate-900">
              {order.orderNumber}
            </span>
            <Badge
              variant={isDelivered ? "default" : isCancelled ? "destructive" : "secondary"}
              className="text-[10px] font-bold uppercase"
            >
              {order.orderStatus.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN")} • Seller:{" "}
            <span className="font-semibold text-slate-800">{order.sellerName}</span>
          </p>
        </div>

        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCancelDialog(true)}
            className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold self-start sm:self-auto"
          >
            Cancel Order
          </Button>
        )}
      </div>

      {cancelMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{cancelMessage}</span>
        </div>
      )}

      {/* 5-Stage Stepper Delivery Tracker */}
      {!isCancelled && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-700" />
              <span>Live Delivery Progression</span>
            </h3>
            {order.trackingInfo?.eta && (
              <Badge variant="outline" className="text-blue-700 border-blue-200 text-[11px] font-semibold">
                ETA: {order.trackingInfo.eta}
              </Badge>
            )}
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 hidden md:block -z-0" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
              {stages.map((stage, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stage.key} className="flex md:flex-col items-center gap-3 md:text-center">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isPassed
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                    >
                      {isPassed ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>

                    <div className="space-y-0.5">
                      <div className={`font-bold text-xs ${isPassed ? "text-slate-900" : "text-slate-400"}`}>
                        {stage.label}
                      </div>
                      <p className="text-[10px] text-slate-500 hidden md:block">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Telemetry Card */}
          {order.trackingInfo && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Fleet Vehicle</span>
                <div className="font-bold text-slate-900">{order.trackingInfo.vehicleNumber}</div>
                <p className="text-slate-500">{order.trackingInfo.carrier}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Driver Assigned</span>
                <div className="font-bold text-slate-900">{order.trackingInfo.driverName}</div>
                <p className="text-emerald-700 font-mono font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{order.trackingInfo.driverPhone}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-bold">Cold Chain Temp</span>
                <div className="font-bold text-emerald-800 flex items-center gap-1">
                  <Thermometer className="h-3.5 w-3.5 text-blue-600" />
                  <span>
                    {order.trackingInfo.coldChainTempCelsius != null
                      ? `${order.trackingInfo.coldChainTempCelsius}°C (Optimal)`
                      : "Temperature N/A"}
                  </span>
                </div>
                <p className="text-slate-500">{order.trackingInfo.currentLocation || "Tracking in progress..."}</p>
              </div>
            </div>
          )}

          {/* Live OpenStreetMap Route Visualizer */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-emerald-600" />
                <span>Live Cold-Chain Transit Telemetry (OpenStreetMap)</span>
              </span>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                Active GPS Link
              </Badge>
            </div>

            <LeafletMap
              origin={{
                name: order.sellerName || "Farm Gate Hub",
                location: { latitude: 20.201, longitude: 73.842 },
                stopType: "ORIGIN",
              }}
              destination={{
                name: order.deliveryAddress?.recipientName
                  ? `${order.deliveryAddress.recipientName} (${order.deliveryAddress.district || "Delivery Hub"})`
                  : "Consumer Doorstep",
                location: {
                  latitude: 18.5204,
                  longitude: 73.8567,
                },
                stopType: "DESTINATION",
              }}
              activeVehicle={order.trackingInfo?.vehicleNumber ? {
                vehicleNumber: order.trackingInfo.vehicleNumber,
                modelName: order.trackingInfo.carrier,
                driverName: order.trackingInfo.driverName,
                location: { latitude: 19.851, longitude: 73.842 },
                temperatureCelsius: order.trackingInfo.coldChainTempCelsius ?? 16,
              } : undefined}
              optimizedPolyline={[
                [20.201, 73.842],
                [19.9975, 73.7898],
                [19.452, 73.342],
                [
                  order.deliveryAddress?.district?.toLowerCase().includes("pune") ? 18.5204 : 19.076,
                  order.deliveryAddress?.district?.toLowerCase().includes("pune") ? 73.8567 : 72.8777,
                ],
              ]}
              showTraditional={false}
              showOptimized={true}
              height="260px"
            />
          </div>
        </div>
      )}

      {/* Itemized Produce List & Receipt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Itemized Farm Receipt</h3>

          <div className="divide-y divide-slate-100 text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.productName}</div>
                  <p className="text-slate-500">
                    {item.quantity} {item.unit} × ₹{item.unitPrice}
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
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Paid</span>
              <span className="text-emerald-800 text-base">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address & Security info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 text-xs">
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
            <p className="text-[11px] text-slate-500">
              Farmer receives payment release upon satisfactory doorstep inspection.
            </p>
          </div>
        </div>
      </div>

      {/* Verified Produce Review Form (Available on Delivered Orders) */}
      {isDelivered && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-base">Rate &amp; Review this Harvest</h3>
            <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold">
              Verified Purchase
            </Badge>
          </div>

          {reviewSubmitted ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="space-y-0.5">
                <div className="font-bold">Thank you for reviewing!</div>
                <p>Your verified rating helps other consumers discover premium smallholder produce.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Share your feedback on harvest freshness, uniform grading, and carrier packaging.
              </p>

              {reviewError && (
                <p className="text-rose-600 font-medium">{reviewError}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Overall Rating (1-5 Stars)</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-xs font-semibold text-slate-900"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 - Very Fresh)</option>
                    <option value={3}>⭐⭐⭐ (3 - Average)</option>
                    <option value={2}>⭐⭐ (2 - Below Standard)</option>
                    <option value={1}>⭐ (1 - Damaged / Spoiled)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Freshness Score (1-5)</label>
                  <select
                    value={freshnessScore}
                    onChange={(e) => setFreshnessScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-xs font-semibold text-slate-900"
                  >
                    <option value={5}>5 / 5 (Crisp / Day-Harvest)</option>
                    <option value={4}>4 / 5 (Fresh)</option>
                    <option value={3}>3 / 5 (Fair)</option>
                    <option value={2}>2 / 5 (Softening)</option>
                    <option value={1}>1 / 5 (Unacceptable)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Packaging / Sorting (1-5)</label>
                  <select
                    value={packagingScore}
                    onChange={(e) => setPackagingScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-xs font-semibold text-slate-900"
                  >
                    <option value={5}>5 / 5 (Ventilated Agri-Crate)</option>
                    <option value={4}>4 / 5 (Secure Mesh Bag)</option>
                    <option value={3}>3 / 5 (Standard Box)</option>
                    <option value={2}>2 / 5 (Minor Bruising)</option>
                    <option value={1}>1 / 5 (Crushed in Transit)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Your Review / Comments</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="The tomatoes were extremely firm, uniform in size, and arrived cold-chain fresh direct from the Nashik farm gate."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <Button
                type="submit"
                disabled={isReviewing}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs gap-1.5"
              >
                {isReviewing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <>
                    <Star className="h-3.5 w-3.5" />
                    <span>Post Verified Review</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Cancellation Dialog Modal */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Confirm Order Cancellation</span>
            </div>

            <p className="text-slate-600">
              Are you sure you want to cancel order <strong>{order.orderNumber}</strong>? Since the produce has not yet been dispatched, your payment will be credited back via KisanDirect Escrow refund.
            </p>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Reason for Cancellation (Optional)</label>
              <input
                type="text"
                placeholder="Ordered incorrect quantity / duplicate"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(false)}
                className="rounded-xl text-xs"
              >
                Keep Order
              </Button>
              <Button
                size="sm"
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
