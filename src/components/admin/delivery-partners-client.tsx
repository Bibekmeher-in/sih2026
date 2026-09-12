"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  ShieldCheck,
  Power,
  RotateCcw,
  Loader2,
  Phone,
  MapPin,
  Bike,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DeliveryPartnersClient() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [onlineFilter, setOnlineFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("verificationStatus", statusFilter);
      if (onlineFilter === "ONLINE") params.append("isOnline", "true");
      if (onlineFilter === "OFFLINE") params.append("isOnline", "false");
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await fetch(`/api/admin/delivery-partners?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setPartners(result.data.partners);
        setTotalCount(result.data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to load delivery partners:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, onlineFilter, page]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleVerify = async (partnerId: string, action: "VERIFY" | "REJECT") => {
    let reason: string | null = "";
    if (action === "REJECT") {
      reason = prompt("Enter rejection reason for this partner:");
      if (!reason) return;
    }

    setActionLoading(partnerId);
    try {
      const res = await fetch(`/api/admin/delivery-partners/${partnerId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const result = await res.json();
      if (result.success) {
        setNotification(`Partner ${action === "VERIFY" ? "VERIFIED" : "REJECTED"}`);
        setTimeout(() => setNotification(null), 3000);
        await fetchPartners();
      } else {
        alert(result.message || "Failed to update verification status");
      }
    } catch {
      alert("Network error updating verification");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (partnerId: string, action: "SUSPEND" | "REACTIVATE") => {
    let reason: string | null = "";
    if (action === "SUSPEND") {
      reason = prompt("Enter suspension reason:");
      if (!reason) return;
    }

    setActionLoading(partnerId);
    try {
      const res = await fetch(`/api/admin/delivery-partners/${partnerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const result = await res.json();
      if (result.success) {
        setNotification(`Partner account ${action === "SUSPEND" ? "SUSPENDED" : "REACTIVATED"}`);
        setTimeout(() => setNotification(null), 3000);
        await fetchPartners();
      } else {
        alert(result.message || "Failed to update account status");
      }
    } catch {
      alert("Network error updating partner status");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="agri-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Delivery Partners Directory &amp; Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage onboarding applications, verify driver licenses, track live duty state &amp; vehicle capacities • Total: {totalCount}
          </p>
        </div>

        {notification && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search driver name, phone, vehicle plate, city..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Verification States</option>
              <option value="PENDING_VERIFICATION">Pending Review</option>
              <option value="VERIFIED">Verified</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Online Filter */}
            <select
              value={onlineFilter}
              onChange={(e) => {
                setOnlineFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Duty Statuses</option>
              <option value="ONLINE">Online Now</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Partners Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Partner</th>
                <th className="py-3.5 px-4">Vehicle Specs</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Duty State</th>
                <th className="py-3.5 px-4">Service Area</th>
                <th className="py-3.5 px-4">Trips Completed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading Delivery Partners...</span>
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No delivery partners match the criteria.
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">{p.fullName}</div>
                      <div className="text-[11px] text-slate-400">{p.phone} • {p.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] font-bold py-0">
                          {p.vehicleType}
                        </Badge>
                        <span>{p.vehicleNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Capacity: {p.vehicleCapacityKg} kg
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.verificationStatus === "VERIFIED" ? (
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                          ✓ Verified
                        </Badge>
                      ) : p.verificationStatus === "PENDING_VERIFICATION" ? (
                        <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                          Pending Review
                        </Badge>
                      ) : p.verificationStatus === "SUSPENDED" ? (
                        <Badge variant="destructive" className="text-[10px] font-bold">
                          Suspended
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {p.verificationStatus}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            p.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                          }`}
                        />
                        <span className={p.isOnline ? "text-emerald-800" : "text-slate-500"}>
                          {p.isOnline ? (p.isAvailableForAssignment ? "Online / Available" : "Online / Busy") : "Offline"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.serviceArea?.city || "Bhubaneswar"} ({p.serviceArea?.radiusKm || 30} km)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {p.statistics?.completedDeliveries || 0}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        Rating: ★{p.statistics?.rating || 4.8}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/delivery-partners/${p._id}`}>
                          <Button variant="outline" size="sm" className="rounded-xl text-[11px] h-8">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>View</span>
                          </Button>
                        </Link>

                        {p.verificationStatus === "PENDING_VERIFICATION" && (
                          <Button
                            onClick={() => handleVerify(p._id, "VERIFY")}
                            disabled={actionLoading === p._id}
                            size="sm"
                            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] h-8"
                          >
                            Verify
                          </Button>
                        )}

                        {p.verificationStatus === "VERIFIED" && (
                          <Button
                            onClick={() => handleStatusChange(p._id, "SUSPEND")}
                            disabled={actionLoading === p._id}
                            variant="destructive"
                            size="sm"
                            className="rounded-xl text-[11px] h-8"
                          >
                            Suspend
                          </Button>
                        )}

                        {p.verificationStatus === "SUSPENDED" && (
                          <Button
                            onClick={() => handleStatusChange(p._id, "REACTIVATE")}
                            disabled={actionLoading === p._id}
                            size="sm"
                            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] h-8"
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
