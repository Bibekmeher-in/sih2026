"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Tractor,
  IndianRupee,
  Save,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { farmerProfileFormSchema, FarmerProfileFormInput } from "@/schemas";

export default function FarmerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kccNumber, setKccNumber] = useState("KCC-MH-984210");
  const [aadhaarVerified, setAadhaarVerified] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FarmerProfileFormInput>({
    resolver: zodResolver(farmerProfileFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      farmName: "",
      landAreaAcres: 8.5,
      irrigationType: "Drip Irrigation",
      soilType: "Black Soil / Alluvial",
      primaryCrops: "Tomato, Onion, Green Chilli",
      district: "Nashik",
      state: "Maharashtra",
      bankAccountName: "",
      bankAccountNumber: "",
      bankIfscCode: "",
      bankName: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/farmer/profile");
        const json = await res.json();
        if (json.success && json.profile) {
          const p = json.profile;
          reset({
            name: p.name || "",
            phone: p.phone || "",
            farmName: p.farmName || "",
            landAreaAcres: p.landAreaAcres || 8.5,
            irrigationType: p.irrigationType || "Drip Irrigation",
            soilType: p.soilType || "Black Soil / Alluvial",
            primaryCrops: p.primaryCrops || "Tomato, Onion",
            district: p.district || "Nashik",
            state: p.state || "Maharashtra",
            bankAccountName: p.bankDetails?.accountName || p.name || "",
            bankAccountNumber: p.bankDetails?.accountNumber || "918020038912",
            bankIfscCode: p.bankDetails?.ifscCode || "SBIN0001428",
            bankName: p.bankDetails?.bankName || "State Bank of India (Dindori)",
          });
          if (p.kccNumber) setKccNumber(p.kccNumber);
          if (p.aadhaarVerified !== undefined) setAadhaarVerified(p.aadhaarVerified);
        }
      } catch (err) {
        console.error("Error loading farmer profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [reset]);

  const onSubmit = async (values: FarmerProfileFormInput) => {
    setIsSubmitting(true);
    setSuccessMessage("");
    setServerError("");

    try {
      const res = await fetch("/api/farmer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setSuccessMessage("Farm profile and payout banking details updated successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: unknown) {
      setServerError((err as Error).message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading farmer profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Farm Profile &amp; Grower Credentials
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your land holding records, irrigation infrastructure, and bank payout settings
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Verification Status Banner */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Govt. Verified Farm Identity</span>
                {aadhaarVerified && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
                    Aadhaar Linked
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">KCC Reference: <span className="font-mono font-semibold text-slate-700">{kccNumber}</span></p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs text-emerald-800 border-emerald-300">
            Active Producer Grade A
          </Badge>
        </div>

        {/* Section 1: Basic Grower Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-4 w-4 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">Grower Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
              />
              {errors.name && (
                <p className="text-red-500 text-[11px] mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register("phone")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
              />
              {errors.phone && (
                <p className="text-red-500 text-[11px] mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Farm Land & Cultivation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Tractor className="h-4 w-4 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">Farm Holding &amp; Crops</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Farm Name / Registered Holding <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("farmName")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
              />
              {errors.farmName && (
                <p className="text-red-500 text-[11px] mt-1">{errors.farmName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Land Area (Acres) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                {...register("landAreaAcres", { valueAsNumber: true })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs font-mono"
              />
              {errors.landAreaAcres && (
                <p className="text-red-500 text-[11px] mt-1">
                  {errors.landAreaAcres.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Irrigation Infrastructure <span className="text-red-500">*</span>
              </label>
              <select
                {...register("irrigationType")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white"
              >
                <option value="Drip Irrigation">Drip Irrigation (Water Conserving)</option>
                <option value="Canal">Canal Irrigation</option>
                <option value="Borewell">Borewell &amp; Pump</option>
                <option value="Sprinkler">Sprinkler System</option>
                <option value="Rainfed">Rainfed / Monsoon</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Soil Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("soilType")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Primary Cultivated Crops (Comma separated) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tomato, Onion, Green Chilli, Cabbage"
                {...register("primaryCrops")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
              />
              {errors.primaryCrops && (
                <p className="text-red-500 text-[11px] mt-1">
                  {errors.primaryCrops.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                District <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("district")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("state")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Direct Payout Bank Account */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <IndianRupee className="h-4 w-4 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">Direct Escrow Payout Account</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                {...register("bankAccountName")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                {...register("bankAccountNumber")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                {...register("bankIfscCode")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 font-mono text-xs uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Bank &amp; Branch Name
              </label>
              <input
                type="text"
                {...register("bankName")}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
            <Save className="h-4 w-4 mr-1.5" />
            <span>{isSubmitting ? "Saving Profile..." : "Save Farm Profile"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
