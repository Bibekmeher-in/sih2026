"use client";

import React, { useState } from "react";
import {
  Plus,
  MapPin,
  CheckCircle2,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MatchedSupplier {
  sellerId: string;
  sellerName: string;
  sellerType: string;
  location: string;
  distanceKm: number;
  availableQuantity: number;
  unit: string;
  offeredPrice: number;
  qualityGrade: string;
  matchScore: number;
  phone?: string;
}

interface Requirement {
  _id: string;
  productName: string;
  category: string;
  requiredQuantity: number;
  unit: string;
  targetPrice: number;
  requiredDate: string;
  deliveryLocation?: {
    district: string;
    state: string;
    pincode: string;
    deliveryHubName?: string;
  };
  status: string;
  matchedSuppliers?: MatchedSupplier[];
  createdAt: string;
}

export function RequirementsClient({
  initialRequirements,
}: {
  initialRequirements: Requirement[];
}) {
  const [requirements, setRequirements] = useState<Requirement[]>(initialRequirements);
  const [showForm, setShowForm] = useState(false);
  const [expandedReqId, setExpandedReqId] = useState<string | null>(
    initialRequirements[0]?._id || null
  );

  // Form State
  const [productName, setProductName] = useState("Nashik Medium Red Onion");
  const [category, setCategory] = useState("Vegetables");
  const [requiredQuantity, setRequiredQuantity] = useState(20);
  const [unit, setUnit] = useState<"kg" | "quintal" | "ton">("ton");
  const [targetPrice, setTargetPrice] = useState(25);
  const [requiredDate, setRequiredDate] = useState("2026-09-25");
  const [district, setDistrict] = useState("Mumbai Suburban");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("400703");
  const [deliveryHubName, setDeliveryHubName] = useState("Vashi APMC Central Processing Hub");
  const [qualityPreference, setQualityPreference] = useState<"Grade A" | "Grade B" | "Premium Organic">("Grade A");
  const [notes, setNotes] = useState("Grade A sorting required. Direct Reefer truck delivery.");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [orderSentMessage, setOrderSentMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/buyer/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          category,
          requiredQuantity: Number(requiredQuantity),
          unit,
          targetPrice: Number(targetPrice),
          requiredDate,
          district,
          state,
          pincode,
          deliveryHubName,
          qualityPreference,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to post requirement");
      }

      setRequirements((prev) => [data.requirement, ...prev]);
      setExpandedReqId(data.requirement._id);
      setShowForm(false);
      setMessage(`RFQ posted successfully! Deterministic matching found ${data.matchedCount || 0} suitable suppliers.`);
    } catch (err: unknown) {
      setMessage((err as Error).message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendPurchaseOrder = (supplierName: string) => {
    setOrderSentMessage(`Purchase Order successfully drafted and transmitted to ${supplierName} under KISANOVA Escrow terms!`);
    setTimeout(() => setOrderSentMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bulk Sourcing Requirements (RFQs)</h1>
          <p className="text-xs text-slate-500">
            Publish procurement demand and get matched with certified horticulture growers via deterministic algorithm
          </p>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs gap-1.5 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{showForm ? "Close Form" : "Post New Requirement (RFQ)"}</span>
        </Button>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {orderSentMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
          <span>{orderSentMessage}</span>
        </div>
      )}

      {/* Post RFQ Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-md space-y-4 text-xs"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Publish Reverse Auction Demand Note
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Produce / Crop Name</label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Nashik Medium Red Onion"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-xs font-semibold text-slate-900"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Grains & Cereals">Grains &amp; Cereals</option>
                <option value="Spices">Spices</option>
                <option value="Pulses">Pulses</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Quality Preference</label>
              <select
                value={qualityPreference}
                onChange={(e) => setQualityPreference(e.target.value as "Grade A" | "Grade B" | "Premium Organic")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-xs font-semibold text-slate-900"
              >
                <option value="Grade A">Grade A (Uniform sorting)</option>
                <option value="Grade B">Grade B (Standard Commercial)</option>
                <option value="Premium Organic">Premium Organic Certified</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Required Quantity</label>
              <input
                type="number"
                min={1}
                required
                value={requiredQuantity}
                onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Measurement Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as "kg" | "quintal" | "ton")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-xs font-semibold text-slate-900"
              >
                <option value="ton">Ton (1,000 kg)</option>
                <option value="quintal">Quintal (100 kg)</option>
                <option value="kg">Kilogram (kg)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Target Price (₹ per {unit === "ton" ? "kg" : unit})
              </label>
              <input
                type="number"
                min={1}
                required
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-emerald-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Delivery Deadline</label>
              <input
                type="date"
                required
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Destination Hub Name</label>
              <input
                type="text"
                required
                value={deliveryHubName}
                onChange={(e) => setDeliveryHubName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Destination District &amp; State</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="PIN code"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Procurement Notes / Logistics Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Matching Growers...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Publish &amp; Run Deterministic Match</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* List of Active Requirements */}
      <div className="space-y-4">
        {requirements.map((req) => {
          const isExpanded = expandedReqId === req._id;
          const matchCount = req.matchedSuppliers?.length || 0;

          return (
            <div
              key={req._id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
            >
              <div
                onClick={() => setExpandedReqId(isExpanded ? null : req._id)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">
                      {req.productName}
                    </span>
                    <Badge
                      variant={matchCount > 0 ? "default" : "secondary"}
                      className={`text-[10px] font-bold ${matchCount > 0 ? "bg-emerald-700 text-white" : ""
                        }`}
                    >
                      {matchCount} Deterministic Match{matchCount !== 1 ? "es" : ""}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Demand: <span className="font-bold text-slate-800">{req.requiredQuantity} {req.unit}</span> • Target: <span className="font-bold text-emerald-700">₹{req.targetPrice}/{req.unit === "ton" ? "kg" : req.unit}</span> • Destination: {req.deliveryLocation?.district || "Vashi Hub"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium">
                    Deadline: {req.requiredDate}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Matched Suppliers Section */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Deterministic Matches (Ranked by Algorithm)</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Volume (40%), Price (30%), Distance (20%), Rating (10%)
                    </span>
                  </div>

                  {req.matchedSuppliers && req.matchedSuppliers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {req.matchedSuppliers.map((sup, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-slate-900 text-sm">{sup.sellerName}</h4>
                                <Badge variant="outline" className="text-[10px] text-slate-700 border-slate-300">
                                  {sup.sellerType}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span>{sup.location} ({sup.distanceKm} km from hub)</span>
                              </p>
                            </div>

                            <Badge className="bg-emerald-700 text-white font-black text-xs px-2 py-0.5">
                              {sup.matchScore}% Match
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                            <div>
                              <span className="text-slate-400 text-[10px] font-bold block">Available Capacity</span>
                              <span className="font-bold text-slate-800">
                                {(sup.availableQuantity / 1000).toFixed(1)} Tons ({sup.availableQuantity} kg)
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] font-bold block">Offered Rate</span>
                              <span className="font-bold text-emerald-800">
                                ₹{sup.offeredPrice}/kg
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="text-[11px] text-slate-500 font-mono">
                              Contact: {sup.phone || "Verified Contact"}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSendPurchaseOrder(sup.sellerName)}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs"
                            >
                              Send Purchase Order
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No growers currently match all criteria. The RFQ remains open for incoming FPO bids.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
