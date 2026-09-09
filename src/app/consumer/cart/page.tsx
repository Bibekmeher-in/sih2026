"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";

export default function ConsumerCartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    serverSummary,
  } = useCart();

  const isFreeDelivery = serverSummary.subtotal >= 500;
  const estimatedSavings = Math.round(serverSummary.subtotal * 0.22);

  if (items.length === 0) {
    return (
      <div className="agri-container max-w-xl py-16 text-center space-y-4">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
          <ShoppingCart className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your Farm Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Explore fresh fruits, vegetables, and grains direct from verified smallholder farmers and FPOs in Maharashtra.
        </p>
        <div className="pt-2">
          <Link href="/marketplace">
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm px-6">
              Browse Marketplace Produce
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="agri-container space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Farm Cart</h1>
          <p className="text-xs text-slate-500">
            {items.length} item{items.length > 1 ? "s" : ""} selected for direct delivery
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
        >
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 border-emerald-300">
                    {item.qualityGrade || "Grade A"}
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium">
                    Seller: <span className="font-semibold text-slate-800">{item.sellerName}</span> ({item.sellerType})
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {item.name}
                </h3>
                {item.variety && (
                  <p className="text-xs text-slate-500">{item.variety}</p>
                )}

                <div className="text-xs font-semibold text-emerald-700 pt-1">
                  ₹{item.price}/{item.unit}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold font-mono">
                    {item.quantity} {item.unit}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <div className="font-bold text-slate-900 text-sm">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-3.5 flex items-center gap-3 text-xs text-emerald-800">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Direct purchase channels <strong>100% of fair farm-gate pricing</strong> directly to grower UPI / Bank Accounts.
            </span>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Order Summary</h3>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1.5 text-slate-600">
              <span>Items Subtotal ({items.length})</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(serverSummary.subtotal)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 text-slate-600">
              <span>Delivery Fee</span>
              {isFreeDelivery ? (
                <span className="font-bold text-emerald-700 uppercase text-[11px]">FREE</span>
              ) : (
                <span className="font-semibold text-slate-900">{formatCurrency(40)}</span>
              )}
            </div>

            <div className="flex justify-between py-1.5 text-emerald-700 font-medium">
              <span>Estimated Supermarket Savings</span>
              <span className="font-bold">-{formatCurrency(estimatedSavings)}</span>
            </div>

            <div className="flex justify-between pt-3 text-sm font-black text-slate-900">
              <span>Total Payable</span>
              <span className="text-emerald-800 text-base">
                {formatCurrency(serverSummary.total || (serverSummary.subtotal + (isFreeDelivery ? 0 : 40)))}
              </span>
            </div>
          </div>

          <Link href="/consumer/checkout" className="block w-full">
            <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm py-5 gap-2 shadow-xs">
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Simulated Instant Payment &amp; Escrow Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
