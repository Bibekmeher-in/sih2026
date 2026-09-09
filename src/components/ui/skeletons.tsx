import React from "react";
import { Skeleton } from "./skeleton";

/** Grid of KPI stat card skeletons */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Full dashboard skeleton: stat cards + chart area */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <StatCardSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Table with configurable row/column count */
export function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="grid gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          className="grid gap-4 px-4 py-3 border-b border-slate-50 last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton key={ci} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Single product card skeleton */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3 mt-2" />
        <Skeleton className="h-9 w-full mt-3 rounded-xl" />
      </div>
    </div>
  );
}

/** Grid of product card skeletons */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
