"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Scale,
  ShieldCheck,
  Loader2,
  X,
  Star,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AssignPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: string;
  orderNumber: string;
  onSuccess: () => void;
}

export function AssignPartnerModal({
  isOpen,
  onClose,
  deliveryId,
  orderNumber,
  onSuccess,
}: AssignPartnerModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (!isOpen || !deliveryId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setShowExplanation(false);

    fetch(`/api/admin/deliveries/${deliveryId}/nearby-partners`)
      .then((r) => r.json())
      .then((result) => {
        if (!isMounted) return;
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || "Failed to find nearby delivery partners");
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Network error finding nearby delivery partners");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, deliveryId]);

  if (!isOpen) return null;

  const handleAssign = async (partnerProfileId: string, isAiAuto = false) => {
    setAssigningId(partnerProfileId);
    try {
      const res = await fetch(`/api/admin/deliveries/${deliveryId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerProfileId,
          method: isAiAuto ? "AI_AUTO" : "ADMIN_MANUAL",
          aiConfidence: data?.confidence,
          aiReason: data?.reason,
          rankingScore: data?.rankedCandidates?.[0]?.aiScore || 90,
        }),
      });

      const result = await res.json();
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(result.message || "Assignment failed");
      }
    } catch {
      alert("Error executing assignment");
    } finally {
      setAssigningId(null);
    }
  };

  const recommended = data?.rankedCandidates?.find(
    (c: any) => c.partnerId === data?.recommendedPartnerId
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                Smart Logistics Engine
              </div>
              <h3 className="text-sm font-black">
                Assign Delivery Partner • Order #{orderNumber}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
              <div className="text-xs font-bold text-slate-700">
                Running Geospatial Proximity &amp; AI Candidate Evaluation...
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Filtering online verified partners, verifying vehicle payload capacity, and querying Google Gemini for optimal dispatch match.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Order Context Strip */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Payload</span>
                  <span className="font-extrabold text-slate-900">{data?.orderWeightKg} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Nearby Found</span>
                  <span className="font-extrabold text-slate-900">{data?.nearbyCount} drivers</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Capacity Match</span>
                  <span className="font-extrabold text-emerald-800">{data?.eligibleCount} eligible</span>
                </div>
              </div>

              {/* AI TOP RECOMMENDATION HIGHLIGHT */}
              {recommended && (
                <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-300/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <span>AI Top Recommendation</span>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px] font-extrabold">
                      {Math.round((data?.confidence || 0.9) * 100)}% Match Confidence
                    </Badge>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-900">{recommended.name}</div>
                      <div className="text-xs text-slate-600">
                        {recommended.vehicleType} ({recommended.vehicleNumber}) • Capacity: {recommended.vehicleCapacityKg} kg
                      </div>
                      <div className="text-[11px] text-emerald-800 font-semibold mt-1">
                        📍 {recommended.distanceToPickupKm} km from pickup • GPS updated {recommended.locationAgeSeconds}s ago
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAssign(recommended.partnerId, true)}
                      disabled={assigningId !== null}
                      className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 shadow-xs shrink-0"
                    >
                      {assigningId === recommended.partnerId ? "Assigning..." : "Auto-Assign Best"}
                    </Button>
                  </div>

                  <p className="text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                    &ldquo;{data?.reason}&rdquo;
                  </p>

                  {/* Explainable AI toggle */}
                  <div>
                    <button
                      onClick={() => setShowExplanation(!showExplanation)}
                      className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <span>{showExplanation ? "Hide Explanation Breakdown" : "Why was this partner selected?"}</span>
                      <ChevronRight className={`h-3 w-3 transition-transform ${showExplanation ? "rotate-90" : ""}`} />
                    </button>

                    {showExplanation && recommended.scoreBreakdown && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-white border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Proximity:</span>
                          <span className="font-bold text-slate-900">✓ {recommended.scoreBreakdown.proximityScore}/40 pts</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Capacity Fit:</span>
                          <span className="font-bold text-slate-900">✓ {recommended.scoreBreakdown.capacityScore}/25 pts</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Current Workload:</span>
                          <span className="font-bold text-slate-900">✓ {recommended.scoreBreakdown.workloadScore}/15 pts</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">GPS Freshness:</span>
                          <span className="font-bold text-slate-900">✓ {recommended.scoreBreakdown.freshnessScore}/10 pts</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ALL RANKED CANDIDATES */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  All Eligible Nearby Candidates ({data?.rankedCandidates?.length || 0})
                </div>

                {data?.rankedCandidates?.length > 0 ? (
                  data.rankedCandidates.map((c: any) => (
                    <div
                      key={c.partnerId}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">{c.name}</span>
                          <Badge variant="outline" className="text-[9px] font-semibold py-0 px-1">
                            {c.vehicleType}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {c.distanceToPickupKm} km away • Cap: {c.vehicleCapacityKg}kg • Rating: ★{c.rating}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAssign(c.partnerId, false)}
                        disabled={assigningId !== null}
                        variant="outline"
                        className="rounded-xl text-xs font-bold hover:bg-slate-900 hover:text-white shrink-0 py-1.5 px-3"
                      >
                        {assigningId === c.partnerId ? "Assigning..." : "Assign"}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No verified delivery partners with sufficient vehicle capacity ({data?.orderWeightKg}kg) and active GPS found within 40 km.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
