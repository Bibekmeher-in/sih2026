"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Filter,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MemberFarmer {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  state: string;
  status: string;
  groups: Array<{ id: string; name: string; product: string; role: string }>;
  joinedDate: string;
}

interface FpoMembersTabProps {
  currentUserId: string;
}

export function FpoMembersTab({ currentUserId }: FpoMembersTabProps) {
  const [members, setMembers] = useState<MemberFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("ALL");

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/fpo/members");
      const data = await res.json();
      if (data.success && data.members) {
        setMembers(data.members);
      }
    } catch (e) {
      console.error("Failed to load members:", e);
    } finally {
      setLoading(false);
    }
  }

  const districts = ["ALL", ...Array.from(new Set(members.map((m) => m.district).filter(Boolean)))];

  const filteredMembers = members.filter((m) => {
    const matchesDistrict = districtFilter === "ALL" || m.district === districtFilter;
    if (!matchesDistrict) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.district.toLowerCase().includes(q) ||
      m.groups.some((g) => g.name.toLowerCase().includes(q) || g.product.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member farmers, phone, village..."
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-600"
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d === "ALL" ? "All Districts" : d}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredMembers.length}</strong> of {members.length} registered farmers
        </div>
      </div>

      {/* Members Grid / Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
          <span>Loading member farmer roster...</span>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-900 text-base">No farmers match search</h4>
          <p className="text-xs text-slate-500">Try changing your district filter or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl bg-white border border-slate-200/90 shadow-xs p-5 space-y-3 flex flex-col justify-between hover:border-emerald-200 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                      {m.name.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{m.name}</h4>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {m.district}, {m.state}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[9px] font-bold bg-emerald-50 text-emerald-800">
                    {m.status}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono text-[11px]">{m.phone}</span>
                </div>
              </div>

              {/* Groups Assigned */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Collectives ({m.groups.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {m.groups.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">No groups joined</span>
                  ) : (
                    m.groups.map((g, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/60 text-[10px] text-slate-700 font-medium"
                      >
                        {g.name} ({g.product})
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
