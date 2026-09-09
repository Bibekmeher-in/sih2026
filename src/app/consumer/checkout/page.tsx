"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";

export default function ConsumerCheckoutPage() {
  const { items, clearCart, serverSummary } = useCart();

  // Delivery Address Form
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<
    "UPI" | "DIRECT_BANK_TRANSFER" | "CASH_ON_DELIVERY" | "NET_BANKING"
  >("UPI");

  // Simulation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    id: string;
    total: number;
    transactionId: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const deliveryFee = serverSummary.subtotal >= 500 ? 0 : 40;
  const grandTotal = serverSummary.subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Add produce lots to proceed.");
      return;
    }

    if (!recipientName || !recipientPhone || !addressLine || !district || !state || !pincode) {
      setErrorMessage("Please complete all delivery address fields.");
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        recipientName,
        recipientPhone,
        addressLine,
        district,
        state,
        pincode,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const res = await fetch("/api/consumer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Order placement failed");
      }

      // Clear the cart
      clearCart();

      // Show confirmation screen
      setConfirmedOrder({
        id: data.order?._id || "",
        orderNumber: data.order?.orderNumber || "",
        total: data.order?.total || grandTotal,
        transactionId: data.order?.transactionRef || `KD-TXN-${Date.now()}`,
      });
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  // If order is placed, show confirmation screen
  if (confirmedOrder) {
    return (
      <div className="agri-container max-w-lg py-12">
        <div className="rounded-3xl border border-emerald-300 bg-white p-6 sm:p-8 shadow-md text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>

          <div className="space-y-1">
            <Badge className="bg-emerald-600 text-white font-bold text-[10px] uppercase">
              Order Confirmed &amp; Dispatched to Farmer
            </Badge>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Payment Successful!
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Order #{confirmedOrder.orderNumber}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Transaction Reference:</span>
              <span className="font-mono font-bold text-slate-800">
                {confirmedOrder.transactionId}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Mode:</span>
              <span className="font-semibold text-slate-800">{paymentMethod}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Amount Paid:</span>
              <span className="font-black text-emerald-800 text-sm">
                {formatCurrency(confirmedOrder.total)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Hub:</span>
              <span className="font-semibold text-slate-800">{district}, {state}</span>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-800 text-left flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Your order is confirmed and live in the database. The farmer will receive payment via KISANOVA Escrow upon delivery confirmation.
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link href={`/consumer/orders/${confirmedOrder.id}`} className="flex-1">
              <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs gap-1.5">
                <Truck className="h-4 w-4" />
                <span>Track Live Delivery</span>
              </Button>
            </Link>
            <Link href="/consumer/orders" className="flex-1">
              <Button variant="outline" className="w-full border-slate-200 text-slate-700 rounded-xl text-xs">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="agri-container space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Link href="/consumer/cart" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Cart</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900">Direct Farm Checkout</h1>
        <p className="text-xs text-slate-500">
          Review produce lots, enter delivery address, and complete your order
        </p>
      </div>

      {/* Escrow Protection Notice */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-700">
            KISANOVA Escrow Protection
          </span>
          <p className="text-emerald-800 leading-relaxed">
            Your payment is held securely in escrow. The farmer receives funds only after you confirm doorstep delivery. This protects both buyers and growers.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Address & Payment Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Delivery Address Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Delivery Address</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Recipient Full Name</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">10-Digit Mobile Number</label>
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Door / Building / Street Address</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">District / City</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Pincode</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Payment Method Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Select Payment Method</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setPaymentMethod("UPI")}
                className={`rounded-xl border p-3.5 flex items-start gap-3 cursor-pointer transition-all ${paymentMethod === "UPI"
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                <QrCode className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-900">Instant UPI</div>
                  <p className="text-slate-500 text-[11px]">
                    Google Pay, PhonePe, Paytm, BHIM QR
                  </p>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                className={`rounded-xl border p-3.5 flex items-start gap-3 cursor-pointer transition-all ${paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                <Banknote className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-900">Cash on Delivery (COD)</div>
                  <p className="text-slate-500 text-[11px]">
                    Pay cash upon farm doorstep delivery
                  </p>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod("NET_BANKING")}
                className={`rounded-xl border p-3.5 flex items-start gap-3 cursor-pointer transition-all ${paymentMethod === "NET_BANKING"
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                <Building className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-900">Direct Bank NetBanking</div>
                  <p className="text-slate-500 text-[11px]">
                    SBI, HDFC, ICICI, Axis Bank Sandbox
                  </p>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod("DIRECT_BANK_TRANSFER")}
                className={`rounded-xl border p-3.5 flex items-start gap-3 cursor-pointer transition-all ${paymentMethod === "DIRECT_BANK_TRANSFER"
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                <CreditCard className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-900">Kisan Escrow Transfer</div>
                  <p className="text-slate-500 text-[11px]">
                    Funds held in escrow until inspection
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Summary & Action */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Produce Lot Items ({items.length})</h3>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1 text-xs">
              {items.map((i) => (
                <div key={i.productId} className="py-2 flex justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{i.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {i.quantity} {i.unit} × ₹{i.price} • Seller: {i.sellerName}
                    </div>
                  </div>
                  <div className="font-bold text-slate-800 shrink-0">
                    {formatCurrency(i.price * i.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(serverSummary.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span className="font-bold text-emerald-700 uppercase text-[10px]">FREE</span>
                ) : (
                  <span className="font-semibold text-slate-900">{formatCurrency(40)}</span>
                )}
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="text-emerald-800 text-base">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm py-5 shadow-xs gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Pay &amp; Confirm Order ({formatCurrency(grandTotal)})</span>
                </>
              )}
            </Button>

            <p className="text-[11px] text-center text-slate-400">
              Zero risk • Full escrow buyer protection
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
