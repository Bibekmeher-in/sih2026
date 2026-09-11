"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  Plus,
  TrendingUp,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldCheck,
  MapPin,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Contribution {
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  quantity: number;
  expectedPrice: number;
  qualityGrade: string;
  harvestDate: string;
  availableDate: string;
  status: string;
}

interface ProduceAggregationItem {
  _id: string;
  groupId: string;
  groupName: string;
  productName: string;
  category: string;
  targetQuantity: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  targetPrice?: number;
  status: string;
  location: string;
  contributions: Contribution[];
}

interface FpoAggregationTabProps {
  currentUserId: string;
  groupsList: Array<{ id: string; name: string; product: string }>;
}

export function FpoAggregationTab({ currentUserId, groupsList }: FpoAggregationTabProps) {
  const [aggregations, setAggregations] = useState<ProduceAggregationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pool Produce Modal
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(groupsList[0]?.id || "");
  const [quantity, setQuantity] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [qualityGrade, setQualityGrade] = useState("Grade A");
  const [harvestDate, setHarvestDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAggregations();
  }, []);

  async function fetchAggregations() {
    setLoading(true);
    try {
      const res = await fetch("/api/fpo/aggregation");
      const data = await res.json();
      if (data.success && data.aggregations) {
        setAggregations(data.aggregations);
      }
    } catch (e) {
      console.error("Failed to load aggregations:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProduce(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGroupId || !quantity || !expectedPrice || isSubmitting) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/fpo/aggregation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          quantity: Number(quantity),
          expectedPrice: Number(expectedPrice),
          qualityGrade,
          harvestDate: harvestDate || new Date().toISOString(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`Successfully pooled ${quantity} kg into group aggregation!`);
        setQuantity("");
        setExpectedPrice("");
        setShowPoolModal(false);
        fetchAggregations();
      }
    } catch (err) {
      console.error("Failed to pool produce:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner & Action Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Produce Aggregation &amp; Cold Pooling Hub</h3>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-xs">
              Smallholder Scale Engine
            </Badge>
          </div>
          <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
            Individual smallholders pool their 50–250 kg harvest lots into unified 500–5,000 kg wholesale batches. This unlocks tier-1 corporate buyer prices, shared transport, and guaranteed cold-chain pickup.
          </p>
        </div>

        <button
          onClick={() => setShowPoolModal(true)}
          className="px-5 py-2.5 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4 text-emerald-700" />
          <span>Pool My Produce Now</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Aggregation Pools List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
          <span>Loading collective produce pools...</span>
        </div>
      ) : aggregations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Scale className="h-10 w-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-900 text-base">No active produce pools</h4>
          <p className="text-xs text-slate-500">
            Pool lots with your farmer group to meet commercial buyer volumes.
          </p>
          <button
            onClick={() => setShowPoolModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-medium text-xs hover:bg-emerald-800 cursor-pointer"
          >
            Start Produce Pool
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {aggregations.map((agg) => {
            const percent = Math.min(100, Math.round((agg.totalQuantity / Math.max(1, agg.targetQuantity)) * 100));

            return (
              <div
                key={agg._id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-lg font-bold text-slate-900">
                        {agg.productName} Collective Batch
                      </h4>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold ${
                          agg.status === "TARGET_REACHED"
                            ? "bg-emerald-100 text-emerald-800"
                            : agg.status === "RESERVED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {agg.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Group: <strong>{agg.groupName}</strong> | Center: {agg.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Target Benchmark</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        ₹{agg.targetPrice || 30}/kg
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGroupId(agg.groupId);
                        setShowPoolModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Lot</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">
                      Progress: <strong className="text-slate-900">{agg.totalQuantity} kg</strong> of {agg.targetQuantity} kg target
                    </span>
                    <span className="text-emerald-700 font-bold">{percent}% Completed</span>
                  </div>

                  <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Available for buyer: <strong>{agg.availableQuantity} kg</strong>
                    </span>
                    {agg.reservedQuantity > 0 && (
                      <span className="text-purple-700 font-medium">
                        Reserved for bulk order: {agg.reservedQuantity} kg
                      </span>
                    )}
                    <span>{agg.contributions?.length || 0} contributing farmers</span>
                  </div>
                </div>

                {/* Contributing Farmers Table */}
                <div className="space-y-2.5">
                  <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-700" />
                    <span>Contributing Farmers &amp; Lot Breakdown</span>
                  </h5>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-y border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Farmer</th>
                          <th className="py-2.5 px-3">Quantity</th>
                          <th className="py-2.5 px-3">Quality Grade</th>
                          <th className="py-2.5 px-3">Expected Rate</th>
                          <th className="py-2.5 px-3">Subtotal Est.</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {agg.contributions?.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {c.farmerName}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {c.farmerPhone}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-800">
                              {c.quantity} kg
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant="outline" className="text-[10px] font-medium text-slate-700">
                                {c.qualityGrade}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3">₹{c.expectedPrice}/kg</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              ₹{(c.quantity * c.expectedPrice).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" /> Committed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pool Produce Modal */}
      {showPoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Pool Produce into Group Aggregation</h3>
              <button
                onClick={() => setShowPoolModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduce} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Farmer Group / Crop Pool
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-600"
                  required
                >
                  {groupsList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.product})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Produce Quantity (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Farm-Gate Price (₹/kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={expectedPrice}
                    onChange={(e) => setExpectedPrice(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 font-bold text-emerald-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Grade A">Grade A (Export / Supermarket Premium)</option>
                    <option value="Grade B">Grade B (Standard Market Quality)</option>
                    <option value="Premium Organic">Premium Certified Organic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ready / Harvest Date
                  </label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 leading-normal space-y-1">
                <strong>✓ Collective Bargaining Protection:</strong>
                <p>
                  Your produce is committed to the FPO aggregation pool. When a commercial buyer order is accepted, funds are escrow-held and distributed proportionally to all contributing farmers.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPoolModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !quantity || !expectedPrice}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Commit Produce to Pool</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
