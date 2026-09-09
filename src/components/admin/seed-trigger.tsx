"use client";

import React, { useState, useTransition } from "react";
import { Database, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminSeedTrigger() {
  const [status, setStatus] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSeed = () => {
    setStatus(null);
    setIsError(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/seed", { method: "POST" });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setIsError(true);
          setStatus(data.message || "Failed to seed demo accounts.");
          return;
        }

        setIsError(false);
        setStatus("Successfully populated 5 demo accounts into MongoDB Atlas.");
      } catch {
        setIsError(true);
        setStatus("Network error connecting to /api/seed.");
      }
    });
  };

  return (
    <div className="flex flex-col sm:items-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleSeed}
        className="flex items-center gap-2 border-slate-300 text-xs font-semibold"
      >
        <Database className="h-3.5 w-3.5 text-emerald-700" />
        {isPending ? "Seeding Database..." : "Seed / Reset Demo Accounts"}
      </Button>

      {status && (
        <div
          className={`text-[11px] font-medium flex items-center gap-1.5 ${
            isError ? "text-red-600" : "text-emerald-700"
          }`}
        >
          {isError ? (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{status}</span>
        </div>
      )}
    </div>
  );
}
