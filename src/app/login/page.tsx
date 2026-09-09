"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Sprout,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Tractor,
  Users,
  Building2,
  Store,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_PASSWORD } from "@/config/demo-users";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const registered = searchParams.get("registered");
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });

        if (!result || result.error) {
          setErrorMessage(
            result?.error || "Invalid email or password. Please try again."
          );
          return;
        }

        // Fetch session to determine role-based redirect
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role;

        let targetUrl = callbackUrl || "/";
        if (!callbackUrl || callbackUrl === "/") {
          switch (role) {
            case "FARMER":
              targetUrl = "/farmer";
              break;
            case "FPO":
              targetUrl = "/fpo";
              break;
            case "BULK_BUYER":
              targetUrl = "/buyer";
              break;
            case "CONSUMER":
              targetUrl = "/consumer";
              break;
            case "ADMIN":
              targetUrl = "/admin";
              break;
            default:
              targetUrl = "/";
          }
        }

        router.push(targetUrl);
        router.refresh();
      } catch {
        setErrorMessage("An unexpected authentication error occurred. Please retry.");
      }
    });
  };

  return (
    <div className="w-full max-w-md">
      {/* Registration success notice */}
      {registered && (
        <div className="mb-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Registration complete! Please sign in with your new credentials.</span>
        </div>
      )}

      {/* Main Login Card */}
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
            {t("auth.signInTitle", "Sign In to Your Account")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              "auth.signInSubtitle",
              "Access your agricultural trade portal with your verified credentials"
            )}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="email"
              placeholder="e.g. farmer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700"
              >
                {t("auth.password", "Password")}
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 pr-10 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{t("auth.rememberMe", "Remember me")}</span>
            </label>
            <span className="text-emerald-700 hover:underline cursor-pointer">
              Forgot password?
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
                <span>{t("common.loading", "Authenticating...")}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <span>{t("auth.signInButton", "Sign In to Portal")}</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        {/* Quick Demo Credentials Autofill */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {t("auth.quickDemoLogin", "1-Click Demo Accounts")}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
              Auto-filled
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleSelectDemo("farmer@example.com")}
              className="p-1.5 rounded border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all"
            >
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Tractor className="h-3 w-3 text-emerald-700" />
                <span>{t("portalNav.farmers", "Farmer")}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">farmer@example.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemo("fpo@example.com")}
              className="p-1.5 rounded border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all"
            >
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Users className="h-3 w-3 text-emerald-700" />
                <span>{t("portalNav.fpos", "FPO Hub")}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">fpo@example.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemo("buyer@example.com")}
              className="p-1.5 rounded border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all"
            >
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-emerald-700" />
                <span>{t("portalNav.buyers", "Bulk Buyer")}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">buyer@example.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemo("consumer@example.com")}
              className="p-1.5 rounded border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all"
            >
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Store className="h-3 w-3 text-emerald-700" />
                <span>{t("nav.consumerPortal", "Consumer")}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">consumer@example.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemo("admin@example.com")}
              className="p-1.5 rounded border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all col-span-2 sm:col-span-1"
            >
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Layers className="h-3 w-3 text-emerald-700" />
                <span>{t("nav.adminPortal", "Admin")}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">admin@example.com</div>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>{t("auth.noAccount", "Don't have an account?")} </span>
          <Link href="/register" className="font-semibold text-emerald-700 hover:underline">
            {t("common.register", "Register for Free")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading sign in portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
