"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Loader2,
  MapPin,
  Ban,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  availableQuantity: number;
  minimumOrderQuantity: number;
  qualityGrade: string;
  mandiBenchmarkPrice?: number;
  sellerName?: string;
  seller?: {
    name?: string;
    email?: string;
    role?: string;
  };
  sellerType: string;
  location: {
    district: string;
    state: string;
  };
  status: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "ARCHIVED" | "DISABLED";
  createdAt: string;
}

export function AdminProductsClient() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sellerType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status && status !== "ALL") params.append("status", status);
      if (sellerType && sellerType !== "ALL") params.append("sellerType", sellerType);
      params.append("page", page.toString());
      params.append("limit", "15");

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setProducts(result.data.products);
        setTotalPages(result.data.pagination.totalPages || 1);
        setTotalCount(result.data.pagination.total || 0);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, [search, status, sellerType, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStatusChange = async (productId: string, newStatus: string) => {
    setActionLoading(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? { ...p, status: newStatus as ProductItem["status"] } : p))
        );
        setNotification(`Listing status changed to ${newStatus}`);
        setTimeout(() => setNotification(null), 3000);
      } else {
        alert(result.message || "Failed to update listing status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating product status");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "AVAILABLE":
        return <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px]">Active Listing</Badge>;
      case "LOW_STOCK":
        return <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px]">Low Stock</Badge>;
      case "OUT_OF_STOCK":
        return <Badge variant="outline" className="text-slate-500 border-slate-300 text-[10px]">Out of Stock</Badge>;
      case "ARCHIVED":
        return <Badge variant="outline" className="text-slate-600 border-slate-300 text-[10px]">Archived</Badge>;
      case "DISABLED":
        return <Badge variant="destructive" className="text-[10px]">Disabled by Admin</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
    }
  };

  return (
    <div className="agri-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Produce Catalog &amp; Listing Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time quality grading inspection, price compliance, and listing enforcement • Total Listings: {totalCount}
          </p>
        </div>

        {notification && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search produce name, seller, location..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="ARCHIVED">Archived</option>
              <option value="DISABLED">Disabled by Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Produce</th>
                <th className="py-3 px-4">Seller &amp; Origin</th>
                <th className="py-3 px-4">Price / Mandi Modal</th>
                <th className="py-3 px-4">Available Inventory</th>
                <th className="py-3 px-4">Quality Grade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-500" />
                    <span>Loading catalog listings...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products matching search criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p._id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">
                        {p.seller?.name || p.sellerName || "Verified Producer"}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{p.location.district}, {p.location.state}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">
                        ₹{p.price}/{p.unit}
                      </span>
                      {p.mandiBenchmarkPrice && (
                        <div className="text-[10px] text-slate-400">
                          APMC: ₹{p.mandiBenchmarkPrice}/{p.unit}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold">{p.availableQuantity} {p.unit}</span>
                      <span className="text-[10px] text-slate-400 block">Min: {p.minimumOrderQuantity} {p.unit}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
                        {p.qualityGrade}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/marketplace/${p._id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          <span>View Lot</span>
                        </Link>

                        {p.status === "DISABLED" ? (
                          <Button
                            size="sm"
                            disabled={actionLoading === p._id}
                            onClick={() => handleStatusChange(p._id, "AVAILABLE")}
                            className="h-7 px-2 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
                          >
                            {actionLoading === p._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Enable"
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actionLoading === p._id}
                            onClick={() => handleStatusChange(p._id, "DISABLED")}
                            className="h-7 px-2 text-[11px] rounded-lg flex items-center gap-1"
                          >
                            {actionLoading === p._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Ban className="h-3 w-3" />
                                <span>Disable</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2.5 text-xs rounded-lg"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2.5 text-xs rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
