"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

export function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    setDrawerOpen,
    removeItem,
    updateQuantity,
    serverSummary,
    isValidating,
  } = useCart();
  const { t } = useLanguage();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t("cart.cartTitle", "Your Produce Cart")}
                </h2>
                <p className="text-xs text-slate-500">
                  {items.length} {items.length === 1 ? "listing" : "listings"} selected
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body / Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {t("cart.emptyCart", "Your cart is empty")}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {t(
                    "cart.emptyCartDesc",
                    "Explore farm-gate produce listings and add fresh harvests directly to your order."
                  )}
                </p>
                <div className="pt-2">
                  <Button size="sm" onClick={() => setDrawerOpen(false)}>
                    {t("common.exploreMarketplace", "Browse Marketplace")}
                  </Button>
                </div>
              </div>
            ) : (
              items.map((item) => {
                const isOverStock = item.quantity > item.availableQuantity;
                const isBelowMoq = item.quantity < item.minimumOrderQuantity;

                return (
                  <div
                    key={item.productId}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-700 uppercase">
                          {item.variety || item.qualityGrade}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Grower: {item.sellerName} ({item.sellerType})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        aria-label="Remove produce from cart"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Stock / MOQ Warnings */}
                    {isOverStock && (
                      <div className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded flex items-center gap-1 font-medium">
                        <ShieldAlert className="h-3 w-3 shrink-0" />
                        <span>Only {item.availableQuantity} {item.unit} available in stock</span>
                      </div>
                    )}
                    {isBelowMoq && (
                      <div className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded flex items-center gap-1 font-medium">
                        <ShieldAlert className="h-3 w-3 shrink-0" />
                        <span>Minimum order is {item.minimumOrderQuantity} {item.unit}</span>
                      </div>
                    )}

                    {/* Quantity & Line Total */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 text-slate-600 hover:text-slate-900"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.availableQuantity}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {item.unit} @ ₹{item.price}/{item.unit}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer / Checkout Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              {/* Server-Side Calculations */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>{t("cart.subtotal", "Server-Verified Subtotal")}</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(serverSummary.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Truck className="h-3 w-3" /> {t("cart.deliveryFee", "Delivery Logistics")}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {serverSummary.deliveryFee === 0
                      ? t("cart.freeDelivery", "FREE")
                      : formatCurrency(serverSummary.deliveryFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-900">
                  <span>{t("cart.grandTotal", "Order Total")}</span>
                  <span className="text-emerald-800">
                    {formatCurrency(serverSummary.total)}
                  </span>
                </div>
              </div>

              {/* Price Integrity Note */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Zero client markup: Prices verified live with MongoDB inventory.</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  onClick={() => setDrawerOpen(false)}
                >
                  <Link href="/cart">{t("common.view", "Review Cart")}</Link>
                </Button>
                <Button
                  size="sm"
                  disabled={!serverSummary.valid || isValidating}
                  asChild
                  onClick={() => setDrawerOpen(false)}
                >
                  <Link href="/cart" className="flex items-center justify-center gap-1">
                    <span>{t("cart.proceedToCheckout", "Checkout")}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
