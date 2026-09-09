"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingCart,
  Sprout,
  Building2,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/marketplace/product-card";
import { MarketplaceFilters, FilterState } from "@/components/marketplace/marketplace-filters";
import { CartDrawer } from "@/components/marketplace/cart-drawer";
import { MarketProduct } from "@/config/demo-products";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

const INITIAL_FILTERS: FilterState = {
  search: "",
  category: "all",
  sellerType: "all",
  state: "all",
  grade: "all",
  minPrice: 0,
  maxPrice: 150,
  sort: "newest",
};

function MarketplaceContent() {
  const { itemCount, setDrawerOpen } = useCart();
  const { t } = useLanguage();

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [bulkBuyerMode, setBulkBuyerMode] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch Categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.warn("Could not load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Products based on filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.category !== "all") params.set("category", filters.category);
      if (filters.sellerType !== "all") params.set("sellerType", filters.sellerType);
      if (filters.state !== "all") params.set("state", filters.state);
      if (filters.grade !== "all") params.set("grade", filters.grade);
      if (filters.minPrice > 0) params.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice < 150) params.set("maxPrice", String(filters.maxPrice));
      params.set("sort", filters.sort);
      params.set("page", String(page));
      params.set("limit", "12");

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.products) {
        let list: MarketProduct[] = data.products;
        if (bulkBuyerMode) {
          // In bulk buyer mode, prioritize FPO and large lot sizes (>500 kg)
          list = list.filter((p) => p.availableQuantity >= 500);
        }
        setProducts(list);
        setTotalCount(data.pagination?.total || list.length);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, bulkBuyerMode]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* Marketplace Header Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="agri-container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sprout className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Kisan<span className="text-emerald-700">Direct</span>
              </span>
              <span className="text-[10px] block font-bold text-slate-400 uppercase tracking-widest -mt-1">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder={t(
                "marketplace.searchPlaceholder",
                "Search by crop, variety, or district (e.g. Tomato, Nashik, Basmati)..."
              )}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full h-10 pl-9 pr-4 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50/80 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </form>

          {/* Actions & Cart Launcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Bulk Buyer Toggle */}
            <button
              type="button"
              onClick={() => {
                setBulkBuyerMode(!bulkBuyerMode);
                setPage(1);
              }}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                bulkBuyerMode
                  ? "bg-amber-100 border-amber-300 text-amber-900 shadow-xs"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-amber-700" />
              <span>Bulk Buyer Mode</span>
              {bulkBuyerMode && <span className="text-[10px] bg-amber-200 px-1 rounded">Active</span>}
            </button>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            {/* Cart Button with Count Badge */}
            <Button
              onClick={() => setDrawerOpen(true)}
              className="relative flex items-center gap-2 text-xs font-bold h-10"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{t("common.cart", t("nav.cart", "Cart"))}</span>
              {itemCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-white text-emerald-800 text-[11px] font-black flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Marketplace Grid */}
      <main className="agri-container py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar: Filters (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24">
            <MarketplaceFilters
              filters={filters}
              onChange={(newFilters) => {
                setFilters(newFilters);
                setPage(1);
              }}
              onReset={handleReset}
              categories={categories}
            />
          </aside>

          {/* Right Area: Results */}
          <section className="lg:col-span-9 space-y-6">
            {/* Top Toolbar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {bulkBuyerMode ? "Bulk Commercial Produce Lots" : "Farm-Gate Produce Marketplace"}
                </h1>
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-800">{products.length}</span> of{" "}
                  <span className="font-semibold text-slate-800">{totalCount}</span> verified lots
                </p>
              </div>

              {/* Sorting & Filter status */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3" /> Sort:
                </span>
                <select
                  value={filters.sort}
                  onChange={(e) => {
                    setFilters({ ...filters, sort: e.target.value });
                    setPage(1);
                  }}
                  className="h-8 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="newest">Newest Harvest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="availability_desc">Highest Stock Volume</option>
                </select>
              </div>
            </div>

            {/* Active Filter Chips */}
            {(filters.category !== "all" ||
              filters.sellerType !== "all" ||
              filters.state !== "all" ||
              filters.grade !== "all" ||
              filters.search ||
              bulkBuyerMode) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Active Filters:</span>
                {bulkBuyerMode && (
                  <Badge variant="amber" className="text-xs font-medium">
                    Bulk Volume (&gt;500 kg)
                  </Badge>
                )}
                {filters.category !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Category: {filters.category}
                  </Badge>
                )}
                {filters.sellerType !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Seller: {filters.sellerType}
                  </Badge>
                )}
                {filters.state !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    State: {filters.state}
                  </Badge>
                )}
                {filters.grade !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Grade: {filters.grade}
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary" className="text-xs">
                    Query: &quot;{filters.search}&quot;
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-red-600 hover:underline font-semibold ml-1"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-80 rounded-xl border border-slate-200 bg-white p-4 space-y-4 animate-pulse"
                  >
                    <div className="h-40 bg-slate-100 rounded-lg" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-8 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
                <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Package className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  No produce matched your criteria
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Try adjusting your price bounds, clearing active category filters, or searching for broader terms like &quot;Tomato&quot; or &quot;Onion&quot;.
                </p>
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Reset All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <span className="text-xs text-slate-600 font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading KisanDirect Marketplace...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
