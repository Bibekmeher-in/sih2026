"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Bike,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeliveryOnboardingPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState<
    "BIKE" | "SCOOTER" | "THREE_WHEELER" | "MINI_TRUCK" | "TRUCK" | "OTHER"
  >("BIKE");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleCapacityKg, setVehicleCapacityKg] = useState(40);
  const [governmentIdType, setGovernmentIdType] = useState<"AADHAAR" | "PAN" | "VOTER_ID">("AADHAAR");
  const [governmentIdNumber, setGovernmentIdNumber] = useState("");
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [drivingLicenseExpiry, setDrivingLicenseExpiry] = useState("");
  const [vehicleRegistrationNumber, setVehicleRegistrationNumber] = useState("");
  const [city, setCity] = useState("Bhubaneswar");
  const [radiusKm, setRadiusKm] = useState(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-set reasonable default capacity on vehicle type change
  const handleVehicleTypeChange = (type: typeof vehicleType) => {
    setVehicleType(type);
    switch (type) {
      case "BIKE":
        setVehicleCapacityKg(40);
        break;
      case "SCOOTER":
        setVehicleCapacityKg(35);
        break;
      case "THREE_WHEELER":
        setVehicleCapacityKg(350);
        break;
      case "MINI_TRUCK":
        setVehicleCapacityKg(1000);
        break;
      case "TRUCK":
        setVehicleCapacityKg(3500);
        break;
      default:
        setVehicleCapacityKg(50);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/delivery/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          vehicleType,
          vehicleNumber,
          vehicleCapacityKg: Number(vehicleCapacityKg),
          governmentIdType,
          governmentIdNumber,
          drivingLicenseNumber,
          drivingLicenseExpiry: drivingLicenseExpiry || undefined,
          vehicleRegistrationNumber: vehicleRegistrationNumber || vehicleNumber,
          city,
          radiusKm: Number(radiusKm),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit onboarding application");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/delivery/dashboard");
      }, 1500);
    } catch (err: unknown) {
      setError((err as Error).message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-emerald-400 shadow-md mb-3">
            <Truck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Delivery Partner Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Join the KISANOVA agri-logistics fleet. Deliver farm-fresh produce directly from farm gates and FPO hubs to consumers and bulk buyers across Odisha.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
          {error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-rose-800 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>
                Onboarding submitted successfully! Redirecting to your delivery partner dashboard...
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Contact */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>1. Personal Information</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Bikash Mohanty"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="^[6-9]\d{9}$"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9827012345"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Vehicle Selection & Capacity */}
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Bike className="h-4 w-4 text-emerald-600" />
                <span>2. Vehicle &amp; Payload Specifications</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { id: "BIKE", label: "Motorcycle", sub: "~40 kg payload" },
                  { id: "SCOOTER", label: "Scooter / Activa", sub: "~35 kg payload" },
                  { id: "THREE_WHEELER", label: "3-Wheeler Auto", sub: "~350 kg payload" },
                  { id: "MINI_TRUCK", label: "Mini Truck (Tata Ace)", sub: "~1,000 kg payload" },
                  { id: "TRUCK", label: "Medium / Heavy Truck", sub: "~3,500 kg payload" },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVehicleTypeChange(v.id as typeof vehicleType)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      vehicleType === v.id
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="font-bold text-xs">{v.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        vehicleType === v.id ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {v.sub}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. OD-02-AB-1234"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Carrying Capacity (kg) *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={20000}
                    required
                    value={vehicleCapacityKg}
                    onChange={(e) => setVehicleCapacityKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Our AI assignment engine uses this to match suitable order produce weight.
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Required Documents */}
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>3. Verification &amp; Identity Documents</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Government ID Type *
                  </label>
                  <select
                    value={governmentIdType}
                    onChange={(e) => setGovernmentIdType(e.target.value as typeof governmentIdType)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="VOTER_ID">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Government ID Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={governmentIdNumber}
                    onChange={(e) => setGovernmentIdNumber(e.target.value)}
                    placeholder="e.g. 1234 5678 9012"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Driving License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={drivingLicenseNumber}
                    onChange={(e) => setDrivingLicenseNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. OD0220200012345"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    value={drivingLicenseExpiry}
                    onChange={(e) => setDrivingLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Operating Service Area */}
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>4. Service Area &amp; Location Permissions</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Operating City / District *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bhubaneswar, Cuttack, Puri"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Maximum Operating Radius ({radiusKm} km)
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full accent-slate-900 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>5 km</span>
                    <span>50 km</span>
                    <span>100 km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href="/delivery/dashboard"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Skip to Dashboard Preview
              </Link>
              <Button
                type="submit"
                disabled={loading || success}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit for Admin Verification</span>
                    <ArrowRight className="h-4 w-4 text-emerald-400" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
