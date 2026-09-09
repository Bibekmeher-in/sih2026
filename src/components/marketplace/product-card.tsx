"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  CheckCircle2,
  TrendingUp,
  Scale,
  ShoppingCart,
  Check,
  Building2,
  Tractor,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CropImage } from "./crop-image";
import { MarketProduct } from "@/config/demo-products";
import { useCart } from "@/context/cart-context";

interface ProductCardProps {
  product: MarketProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const extraPercentage =
    product.mandiBenchmarkPrice > 0
      ? Math.round(
        ((product.price - product.mandiBenchmarkPrice) / product.mandiBenchmarkPrice) * 100
      )
      : 0;

  const isFPO = product.sellerType === "FPO";

  return (
    <div className="group agri-card flex flex-col justify-between overflow-hidden bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-emerald-400 transition-all">
      {/* Clickable Area Leading to Details */}
      <Link href={`/marketplace/${product._id}`} className="block">
        {/* Visual Crop Image Banner */}
        <div className="relative">
          <CropImage name={product.name} className="h-44 w-full" />

          {/* Quality Grade Badge */}
          <div className="absolute top-2.5 right-2.5">
            <Badge
              variant={product.qualityGrade === "Premium Organic" ? "secondary" : "default"}
              className="text-[10px] font-bold shadow-xs py-0.5"
            >
              {product.qualityGrade}
            </Badge>
          </div>

          {/* Seller Type Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs ${isFPO
                  ? "bg-amber-100/90 text-amber-900 border border-amber-200"
                  : "bg-emerald-100/90 text-emerald-900 border border-emerald-200"
                }`}
            >
              {isFPO ? <Building2 className="h-3 w-3" /> : <Tractor className="h-3 w-3" />}
              <span>{isFPO ? "FPO Aggregate" : "Individual Farmer"}</span>
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* Variety & Name */}
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 tracking-wide uppercase">
              {product.variety}
            </span>
            <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
              {product.name}
            </h3>
          </div>

          {/* Seller & Location */}
          <div className="text-xs text-slate-600 space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{product.sellerName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">
                {product.location.district}, {product.location.state}
              </span>
            </div>
          </div>

          {/* Availability & MOQ */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1 text-slate-600">
              <Scale className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500">In Stock:</span>
              <span className="font-bold text-slate-800">
                {product.availableQuantity.toLocaleString("en-IN")} {product.unit}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              MOQ: {product.minimumOrderQuantity} {product.unit}
            </div>
          </div>

          {/* Price Box */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-center">
            <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500">Mandi Benchmark</div>
              <div className="text-xs font-semibold text-slate-500 line-through">
                ₹{product.mandiBenchmarkPrice}/{product.unit}
              </div>
            </div>
            <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200">
              <div className="text-[10px] text-emerald-700 font-bold">KISANOVA Price</div>
              <div className="text-sm font-bold text-emerald-800">
                ₹{product.price}/{product.unit}
              </div>
            </div>
          </div>

          {extraPercentage > 0 && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <TrendingUp className="h-2.5 w-2.5" />
                +{extraPercentage}% higher direct grower realization
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Action Footer */}
      <div className="p-4 pt-0">
        <Button
          onClick={handleQuickAdd}
          size="sm"
          className={`w-full font-semibold transition-all ${addedAnimation ? "bg-emerald-600 text-white" : ""
            }`}
        >
          {addedAnimation ? (
            <span className="flex items-center justify-center gap-1.5">
              <Check className="h-4 w-4" />
              <span>Added to Cart</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Add to Cart ({product.minimumOrderQuantity} {product.unit})</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
