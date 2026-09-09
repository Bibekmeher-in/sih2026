"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ShieldAlert, ArrowLeft, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get("required") || "Authorized Role";
  const actualRole = searchParams.get("actual");
  const { data: session } = useSession();

  const currentRole = actualRole || session?.user?.role || "GUEST";

  const getDashboardLink = () => {
    switch (currentRole) {
      case "FARMER":
        return "/farmer";
      case "FPO":
        return "/fpo";
      case "BULK_BUYER":
        return "/buyer";
      case "CONSUMER":
        return "/consumer";
      case "ADMIN":
        return "/admin";
      default:
        return "/";
    }
  };

  return (
    <div className="w-full max-w-lg text-center">
      <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100 mb-5">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <Badge variant="destructive" className="mb-3 px-3 py-1 text-xs uppercase font-bold">
          403 — Access Restricted
        </Badge>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Role-Based Access Control
        </h1>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          You do not have permission to view this section of KisanDirect. This module requires the{" "}
          <strong className="text-slate-900 font-semibold">{requiredRole}</strong> role, but your account is currently signed in as{" "}
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
            {currentRole}
          </span>.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href={getDashboardLink()} className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Your Portal</span>
            </Link>
          </Button>

          <Button
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Switch Account</span>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          <span>Return to KisanDirect Home</span>
        </Link>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-slate-500">Checking credentials...</div>}>
        <UnauthorizedContent />
      </Suspense>
    </div>
  );
}
