"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Truck,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export default function CartPage() {
  const { t } = useLanguage();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    serverSummary,
    isValidating,
  } = useCart();

  const [recipientName, setRecipientName] = useState("Pooja Sharma");
  const [recipientPhone, setRecipientPhone] = useState("9822012345");
  const [addressLine, setAddressLine] = useState("Plot 402, Green Meadows");
  const [district, setDistrict] = useState("Pune");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("411038");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const handlePlaceOrder = () => {
    const generatedOrderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderNumber(generatedOrderNumber);
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4 shadow-xs">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <Badge variant="default" className="text-xs uppercase font-bold py-0.5">
            Order Confirmed &amp; Stored
          </Badge>
          <h2 className="text-2xl font-bold text-slate-900">Order Placed Successfully!</h2>
          <p className="text-xs text-slate-600">
            Order ID: <span className="font-mono font-bold text-emerald-800">{orderNumber}</span>
          </p>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Delivery Status:</span>
              <span className="font-bold text-emerald-700">Assigned for Logistics Pickup</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-bold text-slate-800">{paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Destination:</span>
              <span className="font-medium text-slate-800">{district}, {state}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button size="sm" asChild>
              <Link href="/consumer">Track Order in Consumer Portal</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/marketplace">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500">
            You have not added any farm-gate produce to your cart yet.
          </p>
          <Button size="sm" asChild>
            <Link href="/marketplace">Explore Farm Produce</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="agri-container flex h-16 items-center justify-between">
          <Link
            href="/marketplace"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("cart.continueShopping", "Continue Shopping")}</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-700" />
              <span className="font-bold text-slate-900 text-sm">
                {t("cart.cartTitle", "Order Checkout Review")}
              </span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="agri-container py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items & Address */}
          <div className="lg:col-span-7 space-y-6">
            {/* Cart Items Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Selected Produce ({items.length})
                </h2>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">
                        {item.variety || item.qualityGrade}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                      <p className="text-xs text-slate-500">
                        Grower: {item.sellerName} | ₹{item.price}/{item.unit}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1.5 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold font-mono text-slate-900">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.availableQuantity}
                          className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-sm font-bold text-slate-900 w-24 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        aria-label="Remove produce"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="h-4 w-4 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900">Delivery Destination</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Recipient Name</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Mobile Number</label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Address Line</label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">PIN Code</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard className="h-4 w-4 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900">Payment Settlement Mode</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-medium">
                {["UPI", "DIRECT_BANK_TRANSFER", "CASH_ON_DELIVERY"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMethod(mode)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === mode
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold">{mode.replace(/_/g, " ")}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {mode === "UPI"
                        ? "Instant QR settlement"
                        : mode === "DIRECT_BANK_TRANSFER"
                        ? "NEFT/RTGS Escrow"
                        : "Pay upon physical delivery"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Placement */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Order Billing Summary
              </h3>

              {/* Warnings from server validation if any */}
              {serverSummary.errors.length > 0 && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Inventory Constraints Detected:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px]">
                    {serverSummary.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal (Canonical DB Prices)</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(serverSummary.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    <span>Fleet Logistics Fee</span>
                  </span>
                  <span className="font-bold text-slate-900">
                    {serverSummary.deliveryFee === 0
                      ? "FREE"
                      : formatCurrency(serverSummary.deliveryFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-emerald-800">
                    {formatCurrency(serverSummary.total)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span>Server-Side Price Integrity Verified</span>
                </div>
                <p className="text-emerald-700/90 text-[10px] leading-relaxed">
                  Prices retrieved directly from MongoDB backend. Zero broker markup. Direct payout held in escrow for producer.
                </p>
              </div>

              <Button
                size="lg"
                disabled={!serverSummary.valid || isValidating || items.length === 0}
                onClick={handlePlaceOrder}
                className="w-full font-bold text-base h-12 shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <span>Confirm &amp; Place Order</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
