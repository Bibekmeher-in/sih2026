import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  message?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  message = "Something went wrong. Please try again.",
  retry,
  className,
}: ErrorDisplayProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Unable to load data
      </h3>
      <p className="text-sm text-slate-500 max-w-xs mb-5 leading-relaxed">
        {message}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}
