"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  Package,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DeliveryPartnerDetailProps {
  partnerId: string;
}

export default function DeliveryPartnerDetailClient({ partnerId }: DeliveryPartnerDetailProps) {
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchPartnerDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/delivery-partners/${partnerId}`);
      const result = await res.json();
      if (result.success) {
        setPartner(result.data.partner);
        setRecentDeliveries(result.data.recentDeliveries || []);
      }
    } catch (err) {
      console.error("Failed to load partner detail:", err);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    fetchPartnerDetail();
  }, [fetchPartnerDetail]);

  const handleVerify = async (action: "VERIFY" | "REJECT") => {
    let reason: string | null = "";
    if (action === "REJECT") {
      reason = prompt("Enter rejection reason for this partner:");
      if (!reason) return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/delivery-partners/${partnerId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const result = await res.json();
      if (result.success) {
        setNotification(`Partner application successfully ${action === "VERIFY" ? "VERIFIED" : "REJECTED"}`);
        setTimeout(() => setNotification(null), 3500);
        await fetchPartnerDetail();
      } else {
        alert(result.message || "Failed to update verification status");
      }
    } catch {
      alert("Network error updating verification");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (action: "SUSPEND" | "REACTIVATE") => {
    let reason: string | null = "";
    if (action === "SUSPEND") {
      reason = prompt("Enter reason for suspension:");
      if (!reason) return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/delivery-partners/${partnerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const result = await res.json();
      if (result.success) {
        setNotification(`Account ${action === "SUSPEND" ? "SUSPENDED" : "REACTIVATED"}`);
        setTimeout(() => setNotification(null), 3500);
        await fetchPartnerDetail();
      } else {
        alert(result.message || "Failed to update account status");
      }
    } catch {
      alert("Network error updating account status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="agri-container py-16 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-semibold">Loading delivery partner profile...</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="agri-container py-16 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Partner Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The delivery partner profile could not be retrieved.</p>
        <Link href="/admin/delivery-partners">
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="agri-container space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/delivery-partners">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{partner.fullName}</h1>
              {partner.verificationStatus === "VERIFIED" ? (
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  ✓ Verified Partner
                </Badge>
              ) : partner.verificationStatus === "PENDING_VERIFICATION" ? (
                <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                  Pending Verification
                </Badge>
              ) : partner.verificationStatus === "SUSPENDED" ? (
                <Badge variant="destructive" className="text-[10px] font-bold">
                  Suspended
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  {partner.verificationStatus}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Member since {new Date(partner.createdAt).toLocaleDateString()} • Vehicle: {partner.vehicleType} ({partner.vehicleNumber})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {notification && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>{notification}</span>
            </div>
          )}

          {partner.verificationStatus === "PENDING_VERIFICATION" && (
            <>
              <Button
                onClick={() => handleVerify("VERIFY")}
                disabled={actionLoading}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 font-bold"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Verify Application
              </Button>
              <Button
                onClick={() => handleVerify("REJECT")}
                disabled={actionLoading}
                variant="destructive"
                className="rounded-xl text-xs h-9"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            </>
          )}

          {partner.verificationStatus === "VERIFIED" && (
            <Button
              onClick={() => handleStatusChange("SUSPEND")}
              disabled={actionLoading}
              variant="destructive"
              className="rounded-xl text-xs h-9"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Suspend Partner
            </Button>
          )}

          {partner.verificationStatus === "SUSPENDED" && (
            <Button
              onClick={() => handleStatusChange("REACTIVATE")}
              disabled={actionLoading}
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Reactivate Account
            </Button>
          )}
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column: Personal & Contact Info */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact &amp; Account</h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Mobile Phone</div>
                <div className="font-semibold text-slate-900">{partner.phone}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Email Address</div>
                <div className="font-semibold text-slate-900">{partner.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Operating City &amp; Radius</div>
                <div className="font-semibold text-slate-900">
                  {partner.serviceArea?.city || "Bhubaneswar"}, {partner.serviceArea?.state || "Odisha"} ({partner.serviceArea?.radiusKm || 30} km radius)
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] text-slate-400 mb-1">Live Duty State</div>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${partner.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                <span className="font-bold text-slate-800">
                  {partner.isOnline ? (partner.isAvailableForAssignment ? "Online & Ready For Orders" : "Online & Busy On Delivery") : "Offline"}
                </span>
              </div>
              {partner.currentLocation?.updatedAt && (
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  GPS Updated: {new Date(partner.currentLocation.updatedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Vehicle & Documents */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle Specifications &amp; KYC</h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Vehicle Type &amp; Plate</div>
                <div className="font-bold text-slate-900">
                  {partner.vehicleType} • <span className="font-mono text-emerald-800">{partner.vehicleNumber}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400">Payload Capacity</div>
              <div className="text-base font-black text-slate-900">
                {partner.vehicleCapacityKg} <span className="text-xs font-medium text-slate-500">kg maximum</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-[10px] text-slate-400">KYC &amp; Verification Documents</div>
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Driving License</span>
                </div>
                <span className="font-mono font-bold text-slate-800">{partner.documents?.drivingLicenseNumber || "Provided"}</span>
              </div>
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  <span>Aadhaar / Tax ID</span>
                </div>
                <span className="font-mono font-bold text-slate-800">{partner.documents?.aadhaarNumber ? `••••${partner.documents.aadhaarNumber.slice(-4)}` : "Verified"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Statistics & Payouts */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Performance &amp; Banking</h2>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-50 rounded-2xl p-3">
              <div className="text-xl font-black text-slate-900">{partner.statistics?.completedDeliveries || 0}</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Trips Completed</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3">
              <div className="text-xl font-black text-emerald-700">★ {partner.statistics?.rating?.toFixed(1) || "5.0"}</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Customer Rating</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
            <div className="text-[10px] text-slate-400 font-semibold">Bank Settlement Account</div>
            <div className="text-slate-700 font-medium">Bank: {partner.bankDetails?.bankName || "State Bank of India"}</div>
            <div className="text-slate-700 font-mono">A/C: {partner.bankDetails?.accountNumber ? `••••••••${partner.bankDetails.accountNumber.slice(-4)}` : "Registered"}</div>
            <div className="text-slate-700 font-mono">IFSC: {partner.bankDetails?.ifscCode || "SBIN0001234"}</div>
          </div>
        </div>
      </div>

      {/* Recent Deliveries Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Recent Assigned Deliveries ({recentDeliveries.length})</h2>
        {recentDeliveries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No delivery assignments recorded for this partner yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payload / Items</th>
                  <th className="py-3 px-4">Assigned On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDeliveries.map((del) => (
                  <tr key={del._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {del.order?.orderNumber || del.trackingNumber}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {del.status || "ASSIGNED"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {del.order?.items?.length || 1} items ({del.packageDetails?.weightKg || 10} kg)
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(del.createdAt).toLocaleDateString()} {new Date(del.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/deliveries/${del._id}/track`}>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] text-emerald-700">
                          Track Trip
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
