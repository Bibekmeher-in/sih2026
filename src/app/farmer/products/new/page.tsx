import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/farmer/product-form";

export default function NewProductPage() {
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
            List New Produce Lot
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Offer fresh harvest lots directly to verified retail consumers and bulk processors
          </p>
        </div>
      </div>

      <ProductForm isEdit={false} />
    </div>
  );
}
