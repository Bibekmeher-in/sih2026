"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Edit2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Package,
  Layers,
  Search,
  ExternalLink,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface FarmerProduct {
  _id: string;
  name: string;
  hindiName?: string;
  variety?: string;
  categoryName: string;
  price: number;
  mandiBenchmarkPrice: number;
  unit: string;
  availableQuantity: number;
  minimumOrderQuantity: number;
  qualityGrade: string;
  harvestDate: string;
  location: {
    district: string;
    state: string;
  };
  status: string;
}

export default function FarmerProductsPage() {
  const [products, setProducts] = useState<FarmerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQty, setEditQty] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/farmer/products");
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleStartEdit = (p: FarmerProduct) => {
    setEditingId(p._id);
    setEditPrice(p.price);
    setEditQty(p.availableQuantity);
  };

  const handleSaveQuickEdit = async (productId: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/farmer/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: editPrice,
          quantity: editQty,
          status: editQty > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
        }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === productId
              ? {
                  ...p,
                  price: editPrice,
                  availableQuantity: editQty,
                  status: editQty > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
                }
              : p
          )
        );
        setEditingId(null);
      }
    } catch (err) {
      console.error("Error updating produce:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (productId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "AVAILABLE" ? "ARCHIVED" : "AVAILABLE";
    try {
      const res = await fetch(`/api/farmer/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? { ...p, status: nextStatus } : p))
        );
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.variety && p.variety.toLowerCase().includes(search.toLowerCase())) ||
      p.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & New Produce CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Produce &amp; Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your harvest listings, adjust farm-gate prices, and monitor stock levels
          </p>
        </div>

        <Button asChild size="sm">
          <Link href="/farmer/products/new" className="flex items-center gap-1.5 text-xs">
            <PlusCircle className="h-4 w-4" />
            <span>Add New Produce</span>
          </Link>
        </Button>
      </div>

      {/* Search & Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search crop name, variety, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Package className="h-4 w-4 text-emerald-700" />
            <span>Active Listings:</span>
          </div>
          <span className="font-bold text-slate-900 font-mono">
            {products.filter((p) => p.status === "AVAILABLE").length} of {products.length}
          </span>
        </div>
      </div>

      {/* Produce Inventory Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading farm inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Layers className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No produce lots found</p>
            <p className="text-xs text-slate-500">List your first harvest lot to start selling directly to consumers and bulk buyers.</p>
            <Button asChild size="sm" className="mt-2">
              <Link href="/farmer/products/new">List Produce Now</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Produce Details</th>
                  <th className="py-3.5 px-4">Quality &amp; Variety</th>
                  <th className="py-3.5 px-4">Farm Price (₹)</th>
                  <th className="py-3.5 px-4">Mandi Comparison</th>
                  <th className="py-3.5 px-4">Available Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const isEditing = editingId === product._id;
                  const spread = product.price - product.mandiBenchmarkPrice;
                  const spreadPercent = Math.round((spread / (product.mandiBenchmarkPrice || 1)) * 100);

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Category */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                        {product.hindiName && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            {product.hindiName}
                          </div>
                        )}
                        <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                          {product.categoryName} • Harvest: {product.harvestDate || "Fresh"}
                        </div>
                      </td>

                      {/* Variety & Grade */}
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="text-[10px] font-bold border-emerald-300 text-emerald-800">
                          {product.qualityGrade}
                        </Badge>
                        {product.variety && (
                          <div className="text-[11px] text-slate-500 mt-1 font-mono">
                            {product.variety}
                          </div>
                        )}
                      </td>

                      {/* Price / Unit (With inline edit) */}
                      <td className="py-4 px-4 font-mono">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">₹</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-16 h-7 px-2 border border-slate-300 rounded text-xs font-bold text-slate-900"
                            />
                            <span className="text-slate-500">/{product.unit}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-slate-500 text-[11px]">/{product.unit}</span>
                          </div>
                        )}
                      </td>

                      {/* Mandi benchmark & Gain */}
                      <td className="py-4 px-4">
                        <div className="text-[11px] text-slate-500">
                          APMC: ₹{product.mandiBenchmarkPrice}/{product.unit}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-0.5">
                          <TrendingUp className="h-3 w-3" />
                          <span>+{spreadPercent}% vs Mandi</span>
                        </div>
                      </td>

                      {/* Available Stock (With inline edit) */}
                      <td className="py-4 px-4 font-mono">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editQty}
                              onChange={(e) => setEditQty(Number(e.target.value))}
                              className="w-20 h-7 px-2 border border-slate-300 rounded text-xs font-bold text-slate-900"
                            />
                            <span className="text-slate-500">{product.unit}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900">
                              {product.availableQuantity.toLocaleString("en-IN")} {product.unit}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              MOQ: {product.minimumOrderQuantity} {product.unit}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <Badge
                          variant={product.status === "AVAILABLE" ? "default" : "secondary"}
                          className={
                            product.status === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-800 text-[10px]"
                              : "bg-slate-200 text-slate-700 text-[10px]"
                          }
                        >
                          {product.status}
                        </Badge>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <Button
                              size="sm"
                              disabled={isSaving}
                              onClick={() => handleSaveQuickEdit(product._id)}
                              className="h-7 px-2.5 text-xs bg-emerald-700 hover:bg-emerald-800"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              <span>Save</span>
                            </Button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(product)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                              title="Quick Edit Price & Stock"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product._id, product.status)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            title={product.status === "AVAILABLE" ? "Deactivate Listing" : "Activate Listing"}
                          >
                            {product.status === "AVAILABLE" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </button>

                          <Link
                            href={`/farmer/products/${product._id}/edit`}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                            title="Full Product Edit"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
