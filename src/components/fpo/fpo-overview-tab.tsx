"use client";

import React from "react";
import {
  Users,
  Layers,
  MessageSquare,
  Scale,
  ShoppingBag,
  Truck,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OverviewData {
  metrics: {
    activeFarmers: number;
    farmerGroups: number;
    activeDiscussions: number;
    aggregatedProduceKg: number;
    pendingBulkOpportunities: number;
    activeBulkOrders: number;
  };
  topActiveGroups: Array<{
    id: string;
    name: string;
    product: string;
    category: string;
    memberCount: number;
    postCount: number;
    aggregatedQuantityKg: number;
    location: string;
  }>;
  recentCommunityActivity: Array<{
    id: string;
    type: "POST" | "JOIN" | "AGGREGATION" | "BUYER" | "PRICE";
    title: string;
    description: string;
    authorName: string;
    timestamp: Date;
    groupName?: string;
  }>;
  currentBulkOpportunities: Array<{
    id: string;
    buyerName: string;
    productName: string;
    requiredQuantity: number;
    unit: string;
    targetPrice: number;
    location: string;
    requiredDate: Date;
    matchScore: number;
    suitableGroupName?: string;
    availableAggregatedKg?: number;
  }>;
}

interface FpoOverviewTabProps {
  data: OverviewData;
  onNavigateTab: (tab: string, filterParam?: string) => void;
  onOpenAiAssistant: () => void;
}

export function FpoOverviewTab({ data, onNavigateTab, onOpenAiAssistant }: FpoOverviewTabProps) {
  const statCards = [
    {
      title: "Member Farmers",
      value: data.metrics.activeFarmers,
      unit: "Active Growers",
      subtitle: "Verified producers across Odisha",
      icon: Users,
      color: "text-emerald-700 bg-emerald-50 border-emerald-100",
      tab: "members",
    },
    {
      title: "Farmer Groups",
      value: data.metrics.farmerGroups,
      unit: "Active Communities",
      subtitle: "Crop-specific collectives",
      icon: Layers,
      color: "text-blue-700 bg-blue-50 border-blue-100",
      tab: "groups",
    },
    {
      title: "Community Discussions",
      value: data.metrics.activeDiscussions,
      unit: "Posts & Rates",
      subtitle: "Farmer-reported mandi prices & tips",
      icon: MessageSquare,
      color: "text-amber-700 bg-amber-50 border-amber-100",
      tab: "community",
    },
    {
      title: "Aggregated Produce",
      value: data.metrics.aggregatedProduceKg.toLocaleString(),
      unit: "Kilograms",
      subtitle: "Pooled by smallholders for bulk dispatch",
      icon: Scale,
      color: "text-indigo-700 bg-indigo-50 border-indigo-100",
      tab: "aggregation",
    },
    {
      title: "Bulk Buyer Opportunities",
      value: data.metrics.pendingBulkOpportunities,
      unit: "Verified Inquiries",
      subtitle: "Enterprise buyers seeking pooled lots",
      icon: ShoppingBag,
      color: "text-purple-700 bg-purple-50 border-purple-100",
      tab: "opportunities",
    },
    {
      title: "Active Collective Orders",
      value: data.metrics.activeBulkOrders,
      unit: "Orders in Pipeline",
      subtitle: "Escrow locked & logistics confirmed",
      icon: Truck,
      color: "text-teal-700 bg-teal-50 border-teal-100",
      tab: "opportunities",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 6 Rich Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigateTab(card.tab)}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {card.value}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{card.unit}</span>
                  </div>
                </div>
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center border ${card.color} group-hover:scale-105 transition-transform`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{card.subtitle}</span>
                <span className="text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* High-Priority Section: Bulk Opportunities & AI Helper Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bulk Opportunities with Smart Matching */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Current Bulk Buyer Opportunities
                </h3>
                <p className="text-xs text-slate-500">
                  Direct commercial inquiries matched with your farmer pools
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("opportunities")}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
            >
              See All ({data.currentBulkOpportunities.length}) <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {data.currentBulkOpportunities.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No open bulk inquiries at this moment.
              </div>
            ) : (
              data.currentBulkOpportunities.slice(0, 3).map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{opp.buyerName}</span>
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-800 text-[10px] font-bold"
                      >
                        {opp.matchScore}% SMART MATCH
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Crop: <strong className="text-slate-800">{opp.productName}</strong>
                      </span>
                      <span>
                        Demand: <strong>{opp.requiredQuantity} {opp.unit}</strong>
                      </span>
                      <span>
                        Target: <strong className="text-emerald-700">₹{opp.targetPrice}/kg</strong>
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3 w-3" /> {opp.location}
                      </span>
                    </div>
                    {opp.suitableGroupName && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        ✓ Best pool: {opp.suitableGroupName} ({opp.availableAggregatedKg || 0} kg available)
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onNavigateTab("opportunities", opp.id)}
                    className="self-start sm:self-center shrink-0 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Review &amp; Fulfill</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Copilot & Fast Actions Card */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white p-6 shadow-md flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>AI Collective Advisor</span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight leading-snug">
              Maximize Farm-Gate Profits via Produce Pooling
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Our AI analyzes verified Mandi reports, buyer tenders, and current farmer pools in real-time. Consult the advisor before setting lot reserve prices.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={onOpenAiAssistant}
              className="w-full py-3 px-4 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-emerald-700" />
              <span>Ask Community AI Assistant</span>
            </button>
            <button
              onClick={() => onNavigateTab("community")}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors border border-white/15 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Mandi Price Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Active Groups & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Active Groups */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Top Active Farmer Groups</h3>
                <p className="text-xs text-slate-500">
                  Crop communities pooling harvest volume &amp; discussing market trends
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("groups")}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {data.topActiveGroups.map((grp) => (
              <div
                key={grp.id}
                onClick={() => onNavigateTab("groups", grp.id)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-200 bg-white hover:bg-blue-50/30 transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                      {grp.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-slate-600 font-medium">
                      {grp.product}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {grp.memberCount} members
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {grp.postCount} posts
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Scale className="h-3 w-3" /> {grp.aggregatedQuantityKg} kg pooled
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">{grp.location}</span>
                  <span className="text-xs font-semibold text-blue-700 group-hover:underline inline-flex items-center gap-0.5">
                    Enter <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Community Activity */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Recent Community Activity</h3>
                <p className="text-xs text-slate-500">
                  Live pulse of discussions, price alerts, and pooling notices
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("community")}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
            >
              Feed <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {data.recentCommunityActivity.map((act) => {
              let badgeColor = "bg-slate-100 text-slate-700";
              let badgeText = "Post";
              if (act.type === "PRICE") {
                badgeColor = "bg-amber-100 text-amber-800";
                badgeText = "Price Report";
              } else if (act.type === "AGGREGATION") {
                badgeColor = "bg-emerald-100 text-emerald-800";
                badgeText = "Produce Pool";
              } else if (act.type === "BUYER") {
                badgeColor = "bg-purple-100 text-purple-800";
                badgeText = "Buyer Demand";
              }

              return (
                <div
                  key={act.id}
                  onClick={() => onNavigateTab("community")}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {act.title}
                    </span>
                    <Badge variant="secondary" className={`text-[9px] font-bold ${badgeColor}`}>
                      {badgeText}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{act.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>
                      By <strong className="text-slate-700">{act.authorName}</strong> in{" "}
                      <em>{act.groupName}</em>
                    </span>
                    <span className="flex items-center gap-1 text-[10px]">
                      <Clock className="h-3 w-3" />
                      {new Date(act.timestamp).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}
