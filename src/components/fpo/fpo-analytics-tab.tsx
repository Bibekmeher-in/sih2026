"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Scale,
  Users,
  MessageSquare,
  Package,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  totalMembers: number;
  totalGroups: number;
  totalPosts: number;
  totalAggregatedKg: number;
  totalSoldKg: number;
  productDistribution: Record<string, number>;
  activeDiscussions: number;
}

export function FpoAnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch("/api/fpo/analytics");
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
      }
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
        <span>Loading FPO operations analytics...</span>
      </div>
    );
  }

  if (!data) return null;

  const productEntries = Object.entries(data.productDistribution);

  return (
    <div className="space-y-6">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Aggregated Produce</span>
          <div className="text-2xl font-extrabold text-emerald-800 mt-2">
            {data.totalAggregatedKg.toLocaleString()} kg
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Direct from member smallholders</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Collective Groups</span>
          <div className="text-2xl font-extrabold text-blue-800 mt-2">{data.totalGroups} Collectives</div>
          <p className="text-[11px] text-slate-500 mt-1">Multi-crop community clusters</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Member Smallholders</span>
          <div className="text-2xl font-extrabold text-purple-800 mt-2">{data.totalMembers} Producers</div>
          <p className="text-[11px] text-slate-500 mt-1">Active verified farmer profiles</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Community Knowledge Shares</span>
          <div className="text-2xl font-extrabold text-amber-800 mt-2">{data.totalPosts} Discussions</div>
          <p className="text-[11px] text-slate-500 mt-1">Mandi rates, tips &amp; inquiries</p>
        </div>
      </div>

      {/* Distribution by Crop */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-base">Crop-wise Farmer Participation</h4>
            <p className="text-xs text-slate-500">Number of smallholders actively engaged in each crop collective</p>
          </div>
          <Badge variant="outline" className="text-xs text-slate-600 font-semibold">
            {productEntries.length} Crop Lines
          </Badge>
        </div>

        <div className="space-y-3 pt-2">
          {productEntries.map(([product, count]) => {
            const maxVal = Math.max(...productEntries.map(([, c]) => c), 1);
            const pct = Math.round((count / maxVal) * 100);

            return (
              <div key={product} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>{product}</span>
                  <span>{count} Farmers</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
