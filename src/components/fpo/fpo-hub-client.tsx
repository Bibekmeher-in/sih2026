"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Layers,
  MessageSquare,
  Scale,
  ShoppingBag,
  BarChart3,
  Building2,
  Sparkles,
  Bot,
  Bell,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useLanguage } from "@/context/language-context";
import { FpoOverviewTab } from "./fpo-overview-tab";
import { FpoCommunityFeed } from "./fpo-community-feed";
import { FpoGroupsTab } from "./fpo-groups-tab";
import { FpoAggregationTab } from "./fpo-aggregation-tab";
import { FpoOpportunitiesTab } from "./fpo-opportunities-tab";
import { FpoMembersTab } from "./fpo-members-tab";
import { FpoAnalyticsTab } from "./fpo-analytics-tab";
import { FpoProfileTab } from "./fpo-profile-tab";
import { FpoAiAssistantModal } from "./fpo-ai-assistant-modal";

interface FpoHubClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    phone: string;
    status: string;
  };
  initialDashboard: any;
  initialTab?: string;
}

export function FpoHubClient({
  user,
  initialDashboard,
  initialTab = "overview",
}: FpoHubClientProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [dashboardData, setDashboardData] = useState(initialDashboard);
  const [highlightOppId, setHighlightOppId] = useState<string | undefined>(undefined);
  const [activeGroupId, setActiveGroupId] = useState<string | undefined>(undefined);
  const [showAiModal, setShowAiModal] = useState(false);

  // Sync tab with URL search params on client
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "community", label: "Community Feed", icon: MessageSquare, badge: dashboardData.metrics?.activeDiscussions },
    { id: "groups", label: "Farmer Groups", icon: Users, badge: dashboardData.metrics?.farmerGroups },
    { id: "aggregation", label: "Produce Aggregation", icon: Scale, badge: `${dashboardData.metrics?.aggregatedProduceKg || 0} kg` },
    { id: "opportunities", label: "Bulk Opportunities", icon: ShoppingBag, badge: dashboardData.metrics?.pendingBulkOpportunities, highlight: true },
    { id: "members", label: "Members", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "profile", label: "FPO Profile", icon: Building2 },
  ];

  function handleNavigateTab(tabId: string, filterParam?: string) {
    setActiveTab(tabId);
    if (tabId === "opportunities" && filterParam) {
      setHighlightOppId(filterParam);
    } else if (tabId === "groups" && filterParam) {
      setActiveGroupId(filterParam);
    }
    window.history.pushState({}, "", `/fpo?tab=${tabId}`);
  }

  const groupsList = (dashboardData.topActiveGroups || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    product: g.product,
  }));

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                  KisanDirect FPO &amp; Community Hub
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200"
                >
                  {user.role} VIEW
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[280px] sm:max-w-none">
                {dashboardData.fpoDetails?.organizationName || "Odisha Farmers Producer Organization"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <button
              onClick={() => setShowAiModal(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-700" />
              <span>Ask AI Copilot</span>
            </button>

            <div className="hidden sm:block text-right border-l border-slate-200 pl-3">
              <div className="text-xs font-bold text-slate-900">{user.name}</div>
              <div className="text-[10px] text-slate-500 font-mono">{user.phone}</div>
            </div>
            <SignOutButton />
          </div>
        </div>

        {/* Tab Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 py-1.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => handleNavigateTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-200" : "text-slate-400"}`} />
                <span>{t.label}</span>
                {t.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : t.highlight
                        ? "bg-purple-100 text-purple-800"
                        : "bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === "overview" && (
            <FpoOverviewTab
              data={dashboardData}
              onNavigateTab={handleNavigateTab}
              onOpenAiAssistant={() => setShowAiModal(true)}
            />
          )}

          {activeTab === "community" && (
            <FpoCommunityFeed
              currentUserId={user.id}
              activeGroupId={activeGroupId}
              groupsList={groupsList}
            />
          )}

          {activeTab === "groups" && (
            <FpoGroupsTab
              currentUserId={user.id}
              onSelectGroup={(grpId) => {
                setActiveGroupId(grpId);
                setActiveTab("community");
              }}
            />
          )}

          {activeTab === "aggregation" && (
            <FpoAggregationTab
              currentUserId={user.id}
              groupsList={groupsList}
            />
          )}

          {activeTab === "opportunities" && (
            <FpoOpportunitiesTab
              currentUserId={user.id}
              highlightOpportunityId={highlightOppId}
            />
          )}

          {activeTab === "members" && (
            <FpoMembersTab currentUserId={user.id} />
          )}

          {activeTab === "analytics" && (
            <FpoAnalyticsTab />
          )}

          {activeTab === "profile" && (
            <FpoProfileTab currentUserId={user.id} />
          )}
        </div>
      </main>

      {/* Floating AI Assistant Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowAiModal(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-800 to-teal-900 text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 transition-all border border-emerald-400/40 cursor-pointer"
        >
          <div className="h-6 w-6 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-200">
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
          </div>
          <span>Ask KisanDirect AI</span>
        </button>
      </div>

      {/* Floating AI Assistant Modal */}
      <FpoAiAssistantModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        groupId={activeGroupId}
      />
    </div>
  );
}
