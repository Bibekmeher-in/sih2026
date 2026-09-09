"use client";

import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export interface FilterState {
  search: string;
  category: string;
  sellerType: string;
  state: string;
  grade: string;
  minPrice: number;
  maxPrice: number;
  sort: string;
}

interface MarketplaceFiltersProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  categories: { slug: string; name: string }[];
}

const INDIAN_STATES = [
  "All States",
  "Maharashtra",
  "Punjab",
  "Uttar Pradesh",
  "Andhra Pradesh",
  "Tamil Nadu",
  "Karnataka",
  "Haryana",
  "Gujarat",
  "Madhya Pradesh",
];

const QUALITY_GRADES = ["all", "Grade A", "Grade B", "Premium Organic"];

export function MarketplaceFilters({
  filters,
  onChange,
  onReset,
  categories,
}: MarketplaceFiltersProps) {
  const { t } = useLanguage();

  const handleCategoryChange = (slug: string) => {
    onChange({ ...filters, category: slug });
  };

  const handleSellerTypeChange = (type: string) => {
    onChange({ ...filters, sellerType: type });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === "All States" ? "all" : e.target.value;
    onChange({ ...filters, state: val });
  };

  const handleGradeChange = (grade: string) => {
    onChange({ ...filters, grade });
  };

  const handlePriceChange = (field: "minPrice" | "maxPrice", value: number) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-700" />
          <h3 className="font-bold text-slate-900 text-sm">
            {t("common.filter", "Marketplace Filters")}
          </h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-medium transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          <span>{t("common.refresh", "Reset")}</span>
        </button>
      </div>

      {/* 1. Category */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Produce Category
        </span>
        <div className="flex flex-col gap-1 text-xs">
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            className={`px-3 py-1.5 rounded-lg text-left font-medium transition-colors ${
              filters.category === "all"
                ? "bg-emerald-700 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => handleCategoryChange(c.slug)}
              className={`px-3 py-1.5 rounded-lg text-left font-medium transition-colors ${
                filters.category === c.slug
                  ? "bg-emerald-700 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Seller Type (Farmer vs FPO) */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Seller Entity Type
        </span>
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => handleSellerTypeChange("all")}
            className={`py-1.5 rounded-md text-center transition-all ${
              filters.sellerType === "all" ? "bg-white shadow-xs text-emerald-800 font-bold" : "text-slate-600"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleSellerTypeChange("FARMER")}
            className={`py-1.5 rounded-md text-center transition-all ${
              filters.sellerType === "FARMER" ? "bg-white shadow-xs text-emerald-800 font-bold" : "text-slate-600"
            }`}
          >
            Farmers
          </button>
          <button
            type="button"
            onClick={() => handleSellerTypeChange("FPO")}
            className={`py-1.5 rounded-md text-center transition-all ${
              filters.sellerType === "FPO" ? "bg-white shadow-xs text-amber-800 font-bold" : "text-slate-600"
            }`}
          >
            FPOs
          </button>
        </div>
      </div>

      {/* 3. State / Regional Origin */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Regional Origin
        </span>
        <select
          value={filters.state === "all" ? "All States" : filters.state}
          onChange={handleStateChange}
          className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
        >
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Quality Grade */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Quality Grade
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUALITY_GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => handleGradeChange(g)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filters.grade === g
                  ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {g === "all" ? "All Grades" : g}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Price Range */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Price Range (₹/kg)
          </span>
          <span className="text-xs text-slate-500 font-mono">
            ₹{filters.minPrice} - ₹{filters.maxPrice}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-slate-500 mb-0.5 block">Min Price</label>
            <input
              type="number"
              min={0}
              max={filters.maxPrice}
              value={filters.minPrice}
              onChange={(e) => handlePriceChange("minPrice", Number(e.target.value))}
              className="w-full h-8 px-2 rounded border border-slate-300 text-xs text-slate-800"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-0.5 block">Max Price</label>
            <input
              type="number"
              min={filters.minPrice}
              max={200}
              value={filters.maxPrice}
              onChange={(e) => handlePriceChange("maxPrice", Number(e.target.value))}
              className="w-full h-8 px-2 rounded border border-slate-300 text-xs text-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
