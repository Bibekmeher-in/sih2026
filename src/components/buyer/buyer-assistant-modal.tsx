"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Loader2,
  Package,
  MapPin,
  ShieldCheck,
  X,
  MessageSquare,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MatchedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  availableQuantity: number;
  minimumOrderQuantity: number;
  qualityGrade: string;
  location: { state: string; district: string };
  sellerName: string;
}

export function BuyerAssistantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    answer: string;
    matchedProducts: MatchedProduct[];
    source: string;
    model: string;
    totalAvailableInMarket: number;
  } | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/buyer-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to search inventory.");
      }

      setResults(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to query procurement scout.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Find fresh tomatoes with at least 500 kg available",
    "Show Grade A wheat suppliers under ₹30/kg",
    "Find organic or high quality pulses in Maharashtra",
    "Show onion wholesale lots ready for harvest dispatch",
  ];

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
      >
        <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
        <span>AI Procurement Scout</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    AI Wholesale Procurement Scout
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                      MongoDB Grounded
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Find live verified lots from farmers and FPOs with zero hallucinated inventory.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Search input form */}
              <form onSubmit={handleSearch} className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="E.g., Find 500kg Grade A onions under ₹25/kg in Maharashtra..."
                    className="w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="absolute right-1.5 top-1.5 h-8 px-3 bg-emerald-700 hover:bg-emerald-800 text-xs rounded-lg"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Ask Scout"
                    )}
                  </Button>
                </div>

                {/* Sample Prompt Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium self-center">Try:</span>
                  {samplePrompts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setQuery(p);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </form>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <Info className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Results View */}
              {results && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {/* AI Response Narrative */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Procurement Analysis</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-slate-500">
                        Engine: {results.model}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {results.answer}
                    </p>
                  </div>

                  {/* Matched Live Inventory */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Matched Live Lots ({results.matchedProducts.length})
                      </span>
                      <span className="text-xs text-slate-500">
                        Total Stock: {results.totalAvailableInMarket} units
                      </span>
                    </div>

                    {results.matchedProducts.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <Package className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-xs font-medium text-slate-700">
                          No active farm lots matching this exact description right now.
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          You can submit a Bulk RFQ to broadcast this requirement directly to FPOs.
                        </p>
                        <Link
                          href="/buyer/requirements"
                          onClick={() => setIsOpen(false)}
                          className="mt-3 inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
                        >
                          Submit Bulk RFQ →
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {results.matchedProducts.map((p) => (
                          <div
                            key={p.id}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {p.name}
                                </h4>
                                <Badge className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 shrink-0">
                                  {p.qualityGrade}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Seller: {p.sellerName || "Verified Producer"}
                              </p>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span>{p.location?.district || "India"}, {p.location?.state || ""}</span>
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-900">
                                  ₹{p.price}/{p.unit}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  Avail: {p.availableQuantity} {p.unit}
                                </span>
                              </div>
                              <Link
                                href={`/marketplace/${p.id}`}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
                              >
                                <span>View Lot</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Disclaimer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 px-5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Strict zero-hallucination inventory: Matches are queried live from MongoDB.</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs text-slate-600 hover:text-slate-900 h-7"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
