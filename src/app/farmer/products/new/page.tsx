import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/farmer/product-form";

interface NewProductPageProps {
  searchParams?: Promise<{
    name?: string;
    price?: string;
    quantity?: string;
    qualityGrade?: string;
    district?: string;
    state?: string;
    mandiBenchmarkPrice?: string;
  }>;
}

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const params = searchParams ? await searchParams : {};

  const initialData = {
    name: params.name || "",
    price: params.price ? Number(params.price) : undefined,
    mandiBenchmarkPrice: params.mandiBenchmarkPrice ? Number(params.mandiBenchmarkPrice) : undefined,
    quantity: params.quantity ? Number(params.quantity) : undefined,
    qualityGrade: (params.qualityGrade as "Grade A" | "Grade B" | "Premium Organic") || undefined,
    district: params.district || undefined,
    state: params.state || undefined,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/farmer/products"
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            List New Produce Lot
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Offer fresh harvest lots directly to verified retail consumers and bulk processors
          </p>
        </div>
      </div>

      <ProductForm isEdit={false} initialData={initialData} />
    </div>
  );
}
