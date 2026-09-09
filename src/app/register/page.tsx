"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sprout,
  Tractor,
  Users,
  Building2,
  Store,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

type AllowedRole = "FARMER" | "FPO" | "BULK_BUYER" | "CONSUMER";

interface RoleOption {
  id: AllowedRole;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLES: RoleOption[] = [
  {
    id: "FARMER",
    title: "Farmer / Grower",
    subtitle: "List crops, obtain AI Mandi price suggestions, direct dispatch",
    icon: Tractor,
  },
  {
    id: "FPO",
    title: "Farmer Producer Co. (FPO)",
    subtitle: "Aggregate multi-member volume, bulk contracts, cluster logistics",
    icon: Users,
  },
  {
    id: "BULK_BUYER",
    title: "Bulk Buyer / HoReCa",
    subtitle: "Procure by quintals/tons directly from verified farm gates",
    icon: Building2,
  },
  {
    id: "CONSUMER",
    title: "Retail Consumer",
    subtitle: "Farm-to-fork fresh produce delivered directly to your doorstep",
    icon: Store,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [selectedRole, setSelectedRole] = useState<AllowedRole>("FARMER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            phone,
            role: selectedRole,
            district,
            state,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          if (data.errors) {
            setFieldErrors(data.errors);
          }
          setErrorMessage(
            data.message || "Registration could not be completed. Please check your inputs."
          );
          return;
        }

        router.push("/login?registered=true");
      } catch {
        setErrorMessage("Network error during registration. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Register Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xs relative">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs group-hover:scale-105 transition-transform">
                <Sprout className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Kisan<span className="text-emerald-700">Direct</span>
              </span>
            </Link>
            <LanguageSwitcher compact />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {t("auth.registerTitle", "Create Your Account")}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t(
                "auth.registerSubtitle",
                "Select your role in the agricultural network to get started"
              )}
            </p>
          </div>

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
                {Object.keys(fieldErrors).length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-[11px] space-y-0.5">
                    {Object.entries(fieldErrors).map(([field, errs]) => (
                      <li key={field}>
                        <span className="capitalize">{field}</span>: {errs.join(", ")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Role Selection Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Select Your Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-emerald-700 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {role.title}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {role.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Details Form */}
            <div className="pt-2 border-t border-slate-100 space-y-3.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Contact &amp; Security Details
              </span>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    {t("auth.fullName", "Full Name / Organization")}
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="e.g. Rameshwar Patil"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    {t("auth.phone", "Mobile Number (10 digits)")}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9822012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    {t("auth.email", "Email Address")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="e.g. kisan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    {t("auth.password", "Password (min 6 chars)")}
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Location (District & State) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="district"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    District / City
                  </label>
                  <input
                    id="district"
                    type="text"
                    placeholder="e.g. Nashik"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Notice regarding Admin protection */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Administrative accounts are provisioned securely and cannot be registered publicly.
              </span>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 font-semibold"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>{t("common.loading", "Creating Account...")}</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <span>{t("auth.registerButton", "Register for KisanDirect")}</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>{t("auth.haveAccount", "Already have an account?")} </span>
            <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
              {t("common.signIn", "Sign In Here")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
