"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  ArrowRight,
  Loader2,
  Truck,
  ShieldCheck,
  X,
  Scale,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BulkOpportunityItem {
  id: string;
  buyerName: string;
  buyerPhone: string;
  productName: string;
  category: string;
  requiredQuantity: number;
  unit: string;
  targetPrice: number;
  location: string;
  deliveryHub: string;
  requiredDate: string;
  status: string;
  matchScore: number;
  scoreBreakdown: Record<string, number>;
  suitableAggregationId?: string | null;
  suitableGroupName?: string;
  availableAggregatedKg?: number;
}

interface FpoOpportunitiesTabProps {
  currentUserId: string;
  highlightOpportunityId?: string;
}

export function FpoOpportunitiesTab({
  currentUserId,
  highlightOpportunityId,
}: FpoOpportunitiesTabProps) {
  const [opportunities, setOpportunities] = useState<BulkOpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Accept Opportunity Modal
  const [selectedOpp, setSelectedOpp] = useState<BulkOpportunityItem | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [orderCreatedResult, setOrderCreatedResult] = useState<{
    orderId: string;
    orderNumber?: string;
    buyerName: string;
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  async function fetchOpportunities() {
    setLoading(true);
    try {
      const res = await fetch("/api/fpo/opportunities");
      const data = await res.json();
      if (data.success && data.opportunities) {
        setOpportunities(data.opportunities);

        // Auto open if highlighted
        if (highlightOpportunityId) {
          const matched = data.opportunities.find((o: BulkOpportunityItem) => o.id === highlightOpportunityId);
          if (matched) setSelectedOpp(matched);
        }
      }
    } catch (e) {
      console.error("Failed to load opportunities:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptOrder() {
    if (!selectedOpp || !selectedOpp.suitableAggregationId || isAccepting) return;

    setIsAccepting(true);
    try {
      const res = await fetch(`/api/fpo/opportunities/${selectedOpp.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aggregationId: selectedOpp.suitableAggregationId }),
      });
      const data = await res.json();

      if (data.success) {
        setOrderCreatedResult({
          orderId: data.orderId,
          orderNumber: data.order?.orderNumber || `ORD-BLK-${Date.now().toString().slice(-6)}`,
          buyerName: selectedOpp.buyerName,
          totalAmount: selectedOpp.requiredQuantity * selectedOpp.targetPrice,
        });
        fetchOpportunities();
      } else {
        alert(data.message || "Failed to accept opportunity");
      }
    } catch (e) {
      console.error("Accept opportunity error:", e);
      alert("Network error accepting opportunity");
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 text-white p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Bulk Buyer Tender &amp; Smart Opportunity Engine</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 text-xs font-semibold">
              Deterministic Matching
            </span>
          </div>
          <p className="text-xs text-purple-200/80 max-w-2xl leading-relaxed">
            Enterprise buyers place wholesale demand requirements. Our smart matching algorithm scores compatibility across Product (40%), Quantity (25%), Location Proximity (20%), Price Alignment (10%), and Harvest Window (5%).
          </p>
        </div>
      </div>

      {/* Success Order Confirmation Banner */}
      {orderCreatedResult && (
        <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-emerald-900">
                  Bulk Buyer Opportunity Accepted &amp; Order Created!
                </h4>
                <p className="text-xs text-emerald-800">
                  Order Number: <strong className="font-mono">{orderCreatedResult.orderNumber}</strong> (ID: {orderCreatedResult.orderId})
                </p>
              </div>
            </div>
            <button
              onClick={() => setOrderCreatedResult(null)}
              className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-200/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-white border border-emerald-200">
              <span className="text-[11px] text-slate-500 block">Buyer Name</span>
              <strong className="text-slate-900 font-semibold">{orderCreatedResult.buyerName}</strong>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-200">
              <span className="text-[11px] text-slate-500 block">Total Transaction Value</span>
              <strong className="text-emerald-800 font-extrabold text-sm">
                ₹{orderCreatedResult.totalAmount.toLocaleString()}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-200">
              <span className="text-[11px] text-slate-500 block">Escrow &amp; Payment Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-purple-700">
                <ShieldCheck className="h-4 w-4" /> ESCROW_HELD
              </span>
            </div>
          </div>

          <p className="text-xs text-emerald-800 pt-1">
            ✓ Notifications dispatched to all contributing smallholder farmers. Produce volume is now reserved for logistics pickup.
          </p>
        </div>
      )}

      {/* Opportunities List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-purple-700" />
          <span>Searching verified buyer demand...</span>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <ShoppingBag className="h-10 w-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-900 text-base">No open bulk requirements</h4>
          <p className="text-xs text-slate-500">
            Check back shortly for new institutional buyer tenders from retail chains and exporters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const isMatched = opp.status === "MATCHED";

            return (
              <div
                key={opp.id}
                className={`rounded-2xl bg-white border ${
                  isMatched ? "border-slate-200 opacity-70" : "border-purple-200/80 shadow-xs hover:border-purple-300"
                } p-6 transition-all space-y-4`}
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-lg font-bold text-slate-900">{opp.buyerName}</h4>
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-900 text-xs font-extrabold px-2.5 py-0.5"
                      >
                        {opp.matchScore}% MATCH
                      </Badge>
                      {isMatched && (
                        <Badge variant="outline" className="text-slate-500 text-xs font-semibold">
                          FULFILLED / MATCHED
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      Delivery Hub: <strong className="text-slate-700">{opp.deliveryHub}</strong> ({opp.location})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Offer Price</span>
                    <span className="text-2xl font-black text-emerald-700">
                      ₹{opp.targetPrice}/kg
                    </span>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Est. Total: ₹{(opp.requiredQuantity * opp.targetPrice).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Requirement Spec Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Requested Crop</span>
                    <strong className="text-slate-900 font-bold">{opp.productName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Required Quantity</span>
                    <strong className="text-slate-900 font-bold">
                      {opp.requiredQuantity} {opp.unit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Delivery Window</span>
                    <strong className="text-slate-900 font-bold">
                      {new Date(opp.requiredDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Buyer Contact</span>
                    <strong className="text-slate-900 font-mono text-[11px]">{opp.buyerPhone}</strong>
                  </div>
                </div>

                {/* Deterministic Match Breakdown (Part 13 Requirement) */}
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-900 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-700" />
                      Deterministic Compatibility Breakdown:
                    </span>
                    <span className="text-purple-800 font-semibold text-[11px]">
                      Crop {opp.scoreBreakdown.product}% | Quantity {opp.scoreBreakdown.quantity}% | Location {opp.scoreBreakdown.location}% | Price {opp.scoreBreakdown.price}% | Date {opp.scoreBreakdown.date}%
                    </span>
                  </div>

                  {opp.suitableGroupName && (
                    <div className="text-xs text-slate-700 pt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Matched Aggregation Pool: <strong>{opp.suitableGroupName}</strong>
                      </span>
                      <span className="text-slate-600 text-[11px]">
                        Available in pool: <strong className="text-emerald-800">{opp.availableAggregatedKg || 0} kg</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Direct Bank Escrow Protection</span>
                  </div>

                  {!isMatched && (
                    <button
                      onClick={() => setSelectedOpp(opp)}
                      className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Accept &amp; Fulfill Order</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accept Confirmation Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-purple-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
              <div>
                <h3 className="font-bold text-base">Accept Commercial Bulk Order</h3>
                <p className="text-xs text-purple-200">{selectedOpp.buyerName}</p>
              </div>
              <button
                onClick={() => setSelectedOpp(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-2">
                <span className="font-bold text-sm block">Order Fulfillment Contract Summary</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Product:</span>
                    <strong className="text-slate-900">{selectedOpp.productName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Quantity to Lock:</span>
                    <strong className="text-slate-900">{selectedOpp.requiredQuantity} kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Agreed Unit Rate:</span>
                    <strong className="text-emerald-800">₹{selectedOpp.targetPrice}/kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Order Payout:</span>
                    <strong className="text-purple-900 font-extrabold text-sm">
                      ₹{(selectedOpp.requiredQuantity * selectedOpp.targetPrice).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-slate-700 leading-normal">
                <p>
                  <strong>What happens next upon acceptance:</strong>
                </p>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                  <li>
                    A confirmed <strong>Order</strong> is generated in the KisanDirect fulfillment database with escrow status <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-mono">ESCROW_HELD</code>.
                  </li>
                  <li>
                    The aggregation pool status moves to <strong>RESERVED</strong>, locking {selectedOpp.requiredQuantity} kg for this buyer.
                  </li>
                  <li>
                    Immediate SMS/In-App notifications are dispatched to all contributing smallholder farmers.
                  </li>
                  <li>
                    Logistics dispatch details are coordinated with the regional aggregation hub.
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOpp(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAcceptOrder}
                  disabled={isAccepting || !selectedOpp.suitableAggregationId}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isAccepting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Confirm &amp; Accept Opportunity</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
