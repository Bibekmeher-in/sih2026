import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getGroupById } from "@/lib/fpo-community-service";
import { FpoCommunityFeed } from "@/components/fpo/fpo-community-feed";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ArrowLeft,
  MapPin,
  Scale,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function FarmerGroupDetailPage({ params }: GroupPageProps) {
  const { id } = await params;
  const user = await requireRole([USER_ROLES.FPO, USER_ROLES.FARMER, USER_ROLES.ADMIN]);

  const group = await getGroupById(id, user.id);
  if (!group) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans">
      {/* Top Bar */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/fpo?tab=groups"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Farmer Groups</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Viewing as:</span>
            <strong className="text-xs text-slate-900">{user.name}</strong>
            <Badge variant="secondary" className="text-[10px] uppercase font-bold">
              {user.role}
            </Badge>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Group Header Card */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {group.name}
                  </h1>
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1">
                    {group.product}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium text-slate-600">
                    {group.category}
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                  {group.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {group.location.village ? `${group.location.village}, ` : ""}
                    {group.location.district}, {group.location.state}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <strong>{group.memberCount}</strong> active members
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <Scale className="h-4 w-4" />
                    <strong>{group.aggregatedQuantityKg} kg</strong> pooled produce
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-end gap-2 shrink-0">
                <Badge
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1"
                >
                  {group.isMember ? "Active Member" : "Public Group"}
                </Badge>
              </div>
            </div>

            {/* Aggregation Banner if exists */}
            {group.aggregation && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-emerald-700" />
                    Active Produce Aggregation Pool: {group.aggregation.totalQuantity} / {group.aggregation.targetQuantity} kg
                  </span>
                  <p className="text-emerald-800/80">
                    {group.aggregation.contributionsCount} farmers currently pooling for bulk dispatch.
                  </p>
                </div>

                <Link
                  href="/fpo?tab=aggregation"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 text-center"
                >
                  View Pooling Batch
                </Link>
              </div>
            )}
          </div>

          {/* Group Discussions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-700" />
                <span>Group Discussions &amp; Mandi Price Reports</span>
              </h2>
            </div>

            <FpoCommunityFeed
              currentUserId={user.id}
              activeGroupId={group._id}
              groupsList={[{ id: group._id, name: group.name, product: group.product }]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
