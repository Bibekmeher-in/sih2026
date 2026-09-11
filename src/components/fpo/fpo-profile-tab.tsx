"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  Save,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FpoProfileData {
  organizationName: string;
  registrationNumber: string;
  yearOfEstablishment: number;
  memberFarmerCount: number;
  cropSpecialization: string[];
  annualTurnoverLakhs?: number;
  aggregationCenters?: Array<{
    name: string;
    address: string;
    district: string;
    state: string;
    contactPerson: string;
    contactPhone: string;
  }>;
}

interface FpoProfileTabProps {
  currentUserId: string;
}

export function FpoProfileTab({ currentUserId }: FpoProfileTabProps) {
  const [profile, setProfile] = useState<FpoProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [orgName, setOrgName] = useState("");
  const [regNum, setRegNum] = useState("");
  const [year, setYear] = useState(2020);
  const [turnover, setTurnover] = useState(85);
  const [crops, setCrops] = useState("Tomato, Potato, Onion, Rice, Vegetables");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await fetch(`/api/fpo/profile`);
      const json = await res.json();
      if (json.success && json.profile) {
        setProfile(json.profile);
        setOrgName(json.profile.organizationName || "");
        setRegNum(json.profile.registrationNumber || "");
        setYear(json.profile.yearOfEstablishment || 2020);
        setTurnover(json.profile.annualTurnoverLakhs || 85);
        setCrops((json.profile.cropSpecialization || []).join(", "));
      }
    } catch (e) {
      console.error("Failed to fetch FPO profile:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/fpo/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: orgName.trim(),
          registrationNumber: regNum.trim(),
          yearOfEstablishment: Number(year),
          annualTurnoverLakhs: Number(turnover),
          cropSpecialization: crops.split(",").map((c) => c.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
        <span>Loading FPO profile &amp; compliance records...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">FPO Producer Company Profile</h3>
              <p className="text-xs text-slate-500">
                Official Ministry of Agriculture &amp; Corporate Affairs registration records
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs bg-emerald-100 text-emerald-800">
            Certified Producer Company
          </Badge>
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>FPO organization profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Registration / CIN
              </label>
              <input
                type="text"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Year of Establishment
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Annual Turnover (₹ in Lakhs)
              </label>
              <input
                type="number"
                value={turnover}
                onChange={(e) => setTurnover(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Crop Specializations (Comma-separated)
            </label>
            <input
              type="text"
              value={crops}
              onChange={(e) => setCrops(e.target.value)}
              placeholder="e.g. Tomato, Potato, Onion, Rice, Vegetables"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600"
              required
            />
          </div>

          {profile?.aggregationCenters && profile.aggregationCenters.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-700" />
                Primary Mandi Logistics &amp; Cold Aggregation Hub
              </span>
              <p className="text-slate-700 font-semibold">{profile.aggregationCenters[0].name}</p>
              <p className="text-slate-500">
                {profile.aggregationCenters[0].address}, {profile.aggregationCenters[0].district},{" "}
                {profile.aggregationCenters[0].state}
              </p>
              <p className="text-slate-600">
                Hub Coordinator: <strong>{profile.aggregationCenters[0].contactPerson}</strong> (
                {profile.aggregationCenters[0].contactPhone})
              </p>
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
