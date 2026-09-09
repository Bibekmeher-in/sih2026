"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  TrendingUp,
  ShoppingCart,
  Check,
  Building2,
  Tractor,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CropImage } from "@/components/marketplace/crop-image";
import { CartDrawer } from "@/components/marketplace/cart-drawer";
import { MarketProduct } from "@/config/demo-products";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";

interface ProductDetailsPageProps {
  params: Promise<{ productId: string }>;
}

export default function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { productId } = use(params);
  const { addItem, setDrawerOpen, itemCount } = useCart();

  const [product, setProduct] = useState<MarketProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (res.ok && data.product) {
          setProduct(data.product);
          setSelectedQty(data.product.minimumOrderQuantity || 1);
        } else {
          setError(data.message || "Produce lot not found");
        }
      } catch {
        setError("Network error fetching produce specifications");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading Produce Details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900">Produce Lot Not Found</h2>
          <p className="text-xs text-slate-500">{error || "The requested agricultural lot does not exist or has been completed."}</p>
          <Button size="sm" asChild>
            <Link href="/marketplace">Return to Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, selectedQty);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const isFPO = product.sellerType === "FPO";
  const extraPercentage =
    product.mandiBenchmarkPrice > 0
      ? Math.round(
        ((product.price - product.mandiBenchmarkPrice) / product.mandiBenchmarkPrice) * 100
      )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="agri-container flex h-16 items-center justify-between">
          <Link
            href="/marketplace"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Link>

          <Button
            onClick={() => setDrawerOpen(true)}
            size="sm"
            className="relative flex items-center gap-2 text-xs font-bold"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Cart</span>
            {itemCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-white text-emerald-800 text-[11px] font-black flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="agri-container py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Banner & Specs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <CropImage name={product.name} className="h-72 sm:h-80 w-full" />
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                      {product.category.name}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
                      {product.name}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">Variety: {product.variety}</p>
                  </div>
                  <Badge
                    variant={product.qualityGrade === "Premium Organic" ? "secondary" : "default"}
                    className="text-xs font-bold py-1 px-3"
                  >
                    {product.qualityGrade}
                  </Badge>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>

                {/* Agronomic Data Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Harvest Date</span>
                    <span className="text-xs font-bold text-slate-800">
                      {new Date(product.harvestDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Available Stock</span>
                    <span className="text-xs font-bold text-slate-800">
                      {product.availableQuantity.toLocaleString("en-IN")} {product.unit}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Minimum Order</span>
                    <span className="text-xs font-bold text-slate-800">
                      {product.minimumOrderQuantity} {product.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grower & Producer Profile Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    {isFPO ? <Building2 className="h-5 w-5" /> : <Tractor className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{product.sellerName}</h3>
                    <p className="text-xs text-slate-500">
                      {isFPO ? "Registered Farmer Producer Co." : "Verified Agricultural Grower"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[11px] font-bold">
                  Aadhaar &amp; KCC Verified
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    {product.location.district}, {product.location.state}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Hub-and-Spoke Fleet Pickup</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Order Action */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-6">
              {/* Price & Mandi Comparison */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Transparent Farm-Gate Pricing
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Live Mandi Benchmark
                  </span>
                </div>

                <div className="flex items-baseline gap-4">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-emerald-900">
                      ₹{product.price}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 ml-1">
                      per {product.unit}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Mandi Benchmark:{" "}
                    <span className="line-through font-semibold text-slate-600">
                      ₹{product.mandiBenchmarkPrice}/{product.unit}
                    </span>
                  </div>
                </div>

                {extraPercentage > 0 && (
                  <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
                    <span>+{extraPercentage}% direct grower benefit over local middlemen</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="qty-input" className="font-bold text-slate-800">
                    Specify Order Quantity ({product.unit})
                  </label>
                  <span className="text-slate-500">
                    Max: {product.availableQuantity.toLocaleString("en-IN")} {product.unit}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="qty-input"
                    type="number"
                    min={product.minimumOrderQuantity}
                    max={product.availableQuantity}
                    value={selectedQty}
                    onChange={(e) =>
                      setSelectedQty(
                        Math.max(
                          product.minimumOrderQuantity,
                          Math.min(product.availableQuantity, Number(e.target.value))
                        )
                      )
                    }
                    className="w-32 h-11 px-3 text-base font-bold font-mono rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <div className="text-xs text-slate-500">
                    <span>MOQ: {product.minimumOrderQuantity} {product.unit}</span>
                  </div>
                </div>

                {/* Calculated Line Subtotal */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Estimated Item Cost:</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatCurrency(product.price * selectedQty)}
                  </span>
                </div>
              </div>

              {/* Add to Cart CTA */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className={`w-full font-bold text-base h-12 shadow-sm transition-all ${addedAnimation ? "bg-emerald-600" : ""
                    }`}
                >
                  {addedAnimation ? (
                    <span className="flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      <span>Added to Cart!</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      <span>
                        Add {selectedQty} {product.unit} to Cart
                      </span>
                    </span>
                  )}
                </Button>

                <p className="text-[11px] text-center text-slate-400">
                  Prices verified strictly against database records during checkout.
                </p>
              </div>
            </div>

            {/* Quality Certifications & Assurance */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>KISANOVA Quality Guarantee</span>
              </h4>
              <p className="leading-relaxed">
                Produce is graded according to Ministry of Agriculture AGMARK standards. Inspected
                at collection hubs before dispatch to ensure zero transit rot and certified moisture content.
              </p>
            </div>
          </div>
        </div>
      </main>

      <CartDrawer />
    </div>
  );
}
