"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/farmer/product-form";

interface EditProductData {
  _id: string;
  name: string;
  hindiName?: string;
  variety?: string;
  category: string;
  description: string;
  price: number;
  mandiBenchmarkPrice?: number;
  quantity: number;
  unit: "kg" | "quintal" | "ton" | "crate";
  qualityGrade: "Grade A" | "Grade B" | "Premium Organic";
  harvestDate: string;
  district: string;
  state: string;
  minimumOrderQuantity: number;
  status?: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "ARCHIVED";
}

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<EditProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/farmer/products/${id}`);
        const data = await res.json();
        if (res.ok && data.product) {
          setInitialData({
            _id: data.product._id,
            name: data.product.name,
            hindiName: data.product.hindiName,
            variety: data.product.variety,
            category: data.product.categoryName || "Vegetables",
            description: data.product.description || "Fresh harvest lot directly sorted at farm gate.",
            price: data.product.price,
            mandiBenchmarkPrice: data.product.mandiBenchmarkPrice,
            quantity: data.product.availableQuantity,
            unit: data.product.unit,
            qualityGrade: data.product.qualityGrade,
            harvestDate: data.product.harvestDate,
            district: data.product.location?.district || "Nashik",
            state: data.product.location?.state || "Maharashtra",
            minimumOrderQuantity: data.product.minimumOrderQuantity || 1,
            status: data.product.status,
          });
        } else {
          setError(data.message || "Produce lot not found");
        }
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load produce details");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading produce lot details...
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-red-600 font-bold text-sm">{error || "Product not found"}</p>
        <Link
          href="/farmer/products"
          className="text-xs text-emerald-700 font-semibold underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Return to inventory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/farmer/products"
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Edit Produce Lot
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Update harvest price, available stock, or lot specifications
          </p>
        </div>
      </div>

      <ProductForm initialData={initialData} isEdit={true} />
    </div>
  );
}
