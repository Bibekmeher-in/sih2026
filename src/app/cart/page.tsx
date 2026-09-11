"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
  QrCode,
  Banknote,
  Building2,
  Loader2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useRazorpay } from "@/hooks/use-razorpay";

export default function CartPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { openCheckout } = useRazorpay();

  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    serverSummary,
    isValidating,
  } = useCart();

  // Form Fields
  const [recipientName, setRecipientName] = useState("Pooja Sharma");
  const [recipientPhone, setRecipientPhone] = useState("9822012345");
  const [addressLine, setAddressLine] = useState("Plot 402, Green Meadows");
  const [district, setDistrict] = useState("Pune");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("411038");
  const [paymentMethod, setPaymentMethod] = useState<
    "UPI" | "CARD" | "NET_BANKING" | "CASH_ON_DELIVERY"
  >("UPI");

  // Flow State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [cancellationNotice, setCancellationNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Confirmed Order State (ONLY populated AFTER server-side verification or COD order creation)
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    orderNumber: string;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    isCOD: boolean;
  } | null>(null);

  // Auto-fill user information from session if available
  useEffect(() => {
    if (session?.user?.name && recipientName === "Pooja Sharma") {
      setRecipientName(session.user.name);
    }
    if (session?.user?.phone && recipientPhone === "9822012345") {
      setRecipientPhone(session.user.phone);
    }
  }, [session]);

  const isBulkBuyer = session?.user?.role === "BULK_BUYER";
  const buyerType = isBulkBuyer ? "BULK_BUYER" : "CONSUMER";

  const handlePlaceOrder = async (isRetry = false) => {
    setErrorMessage(null);
    setCancellationNotice(null);

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add items to proceed.");
      return;
    }

    if (!recipientName || !recipientPhone || !addressLine || !district || !state || !pincode) {
      setErrorMessage("Please fill in all delivery address fields.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. CASH ON DELIVERY FLOW (Never opens Razorpay)
      if (paymentMethod === "CASH_ON_DELIVERY") {
        setStatusMessage("Confirming Cash on Delivery order...");

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            deliveryAddress: {
              recipientName,
              recipientPhone,
              addressLine,
              district,
              state,
              pincode,
            },
            buyerType,
            paymentMethod: "CASH_ON_DELIVERY",
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to confirm Cash on Delivery order.");
        }

        clearCart();
        setConfirmedOrder({
          id: data.order._id,
          orderNumber: data.order.orderNumber,
          total: data.order.total,
          paymentMethod: "CASH_ON_DELIVERY",
          paymentStatus: "PENDING",
          isCOD: true,
        });
        setIsProcessing(false);
        return;
      }

      // 2. ONLINE PAYMENT FLOW (UPI / CARD / NET_BANKING)
      setStatusMessage("Creating payment...");

      const orderPayload = {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: {
          recipientName,
          recipientPhone,
          addressLine,
          district,
          state,
          pincode,
        },
        buyerType,
        paymentMethod,
        existingOrderId: (isRetry && pendingOrderId) ? pendingOrderId : undefined,
      };

      const initRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const initData = await initRes.json();

      if (!initRes.ok || !initData.success) {
        if (initRes.status === 503 || (initData.message && initData.message.includes("unavailable"))) {
          throw new Error("Online payment is currently unavailable. Please try again or select Cash on Delivery.");
        }
        throw new Error(initData.message || "Failed to create payment session.");
      }

      // Save pending order ID to reuse if user cancels and retries
      if (initData.orderId) {
        setPendingOrderId(initData.orderId);
      }

      setStatusMessage("Opening Razorpay...");

      openCheckout({
        key: initData.keyId,
        amount: initData.amount,
        currency: initData.currency || "INR",
        name: "KisanDirect",
        description: `Order #${initData.orderNumber} Produce Procurement`,
        order_id: initData.razorpayOrderId,
        prefill: {
          name: initData.customer?.name || recipientName,
          email: initData.customer?.email || session?.user?.email || "buyer@kisandirect.in",
          contact: initData.customer?.contact || recipientPhone,
        },
        theme: { color: "#059669" },
        onSuccess: async (rzpResponse) => {
          setStatusMessage("Verifying payment...");
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: initData.orderId,
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
                method: paymentMethod,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setStatusMessage("Payment successful! Order confirmed.");
              clearCart();
              setConfirmedOrder({
                id: initData.orderId,
                orderNumber: initData.orderNumber,
                total: initData.amount / 100,
                paymentMethod,
                paymentStatus: "CAPTURED",
                isCOD: false,
              });
              setPendingOrderId(null);
            } else {
              setErrorMessage(
                verifyData.message ||
                `Payment verification failed. Please contact support with Payment ID: ${rzpResponse.razorpay_payment_id}`
              );
            }
          } catch (vErr: unknown) {
            const msg = vErr instanceof Error ? vErr.message : "Network error during verification";
            setErrorMessage(`Payment verification error: ${msg}`);
          } finally {
            setIsProcessing(false);
          }
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setStatusMessage("");
          setErrorMessage(err.description || "Payment failed or was declined by the bank. You can retry.");
        },
        onDismiss: () => {
          // Razorpay was closed without paying: DO NOT confirm order!
          setIsProcessing(false);
          setStatusMessage("");
          setCancellationNotice("Payment was cancelled. Your order has not been confirmed.");
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setIsProcessing(false);
      setStatusMessage("");
    }
  };

  // Screen 1: Order Confirmed (ONLY displayed after verified server-side payment or verified COD creation)
  if (confirmedOrder) {
    const trackingLink = isBulkBuyer ? "/buyer/orders" : "/consumer";
    const trackingLabel = isBulkBuyer
      ? "View in Purchase Orders"
      : "Track Order in Consumer Portal";

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4 shadow-sm">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <Badge
            variant={confirmedOrder.isCOD ? "secondary" : "default"}
            className="text-xs uppercase font-bold py-0.5"
          >
            {confirmedOrder.isCOD
              ? "COD Order Confirmed — Payment Pending"
              : "Payment Verified & Order Confirmed"}
          </Badge>

          <h2 className="text-2xl font-bold text-slate-900">
            {confirmedOrder.isCOD ? "Order Placed Successfully!" : "Payment Successful!"}
          </h2>
          <p className="text-xs text-slate-600">
            Order ID: <span className="font-mono font-bold text-emerald-800">{confirmedOrder.orderNumber}</span>
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Order Status:</span>
              <span className="font-bold text-emerald-700">CONFIRMED</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Status:</span>
              <span className="font-bold text-slate-800">
                {confirmedOrder.isCOD ? "PENDING (Pay upon Delivery)" : "CAPTURED (Paid Online)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Settlement Mode:</span>
              <span className="font-bold text-slate-800">{confirmedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-black text-slate-900">{formatCurrency(confirmedOrder.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Destination:</span>
              <span className="font-medium text-slate-800">{district}, {state}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button size="sm" asChild>
              <Link href={trackingLink}>{trackingLabel}</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/marketplace">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: Empty Cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
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

  // Screen 3: Main Checkout View
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
                {isBulkBuyer ? "Wholesale Order Checkout" : t("cart.cartTitle", "Order Checkout Review")}
              </span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="agri-container py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items, Address & Payment Mode */}
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
                  disabled={isProcessing}
                  className="text-xs text-red-600 hover:underline font-medium disabled:opacity-40"
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
                          disabled={isProcessing}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold font-mono text-slate-900">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          type="button"
                          disabled={isProcessing || item.quantity >= item.availableQuantity}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
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
                        disabled={isProcessing}
                        onClick={() => removeItem(item.productId)}
                        className="text-slate-400 hover:text-red-600 p-1 disabled:opacity-30"
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
                    disabled={isProcessing}
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Mobile Number</label>
                  <input
                    type="tel"
                    disabled={isProcessing}
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Address Line</label>
                  <input
                    type="text"
                    disabled={isProcessing}
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">District</label>
                  <input
                    type="text"
                    disabled={isProcessing}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">State</label>
                  <input
                    type="text"
                    disabled={isProcessing}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">PIN Code</label>
                  <input
                    type="text"
                    disabled={isProcessing}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                {/* UPI Mode */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setPaymentMethod("UPI")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    paymentMethod === "UPI"
                      ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-600"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <QrCode className="h-4 w-4 text-emerald-700" />
                    <span>UPI (Google Pay / PhonePe / Paytm)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Instant zero-fee QR payment via Razorpay
                  </div>
                </button>

                {/* Card Mode */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setPaymentMethod("CARD")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    paymentMethod === "CARD"
                      ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-600"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CreditCard className="h-4 w-4 text-emerald-700" />
                    <span>Credit / Debit Card</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Visa, Mastercard, RuPay via Razorpay
                  </div>
                </button>

                {/* Net Banking */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setPaymentMethod("NET_BANKING")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    paymentMethod === "NET_BANKING"
                      ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-600"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Building2 className="h-4 w-4 text-emerald-700" />
                    <span>Net Banking / Escrow</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Direct bank transfer with escrow protection
                  </div>
                </button>

                {/* Cash on Delivery */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    paymentMethod === "CASH_ON_DELIVERY"
                      ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-600"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Banknote className="h-4 w-4 text-emerald-700" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Inspect physical produce before payment
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Placement Action */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Order Billing Summary
              </h3>

              {/* Warnings from server validation */}
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

              {/* Payment Dismissal / Cancellation Notice */}
              {cancellationNotice && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Payment Cancelled</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {cancellationNotice}
                  </p>
                  <div className="pt-1">
                    <Button
                      size="sm"
                      onClick={() => handlePlaceOrder(true)}
                      disabled={isProcessing}
                      className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs gap-1.5 h-8 rounded-lg"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry Payment</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* General Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Payment Error</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{errorMessage}</p>
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
                  Direct farm-gate checkout. Online transactions are securely processed and verified via Razorpay before confirmation.
                </p>
              </div>

              {/* Primary Action Button */}
              <Button
                size="lg"
                disabled={!serverSummary.valid || isValidating || items.length === 0 || isProcessing}
                onClick={() => handlePlaceOrder(false)}
                className="w-full font-bold text-base h-12 shadow-sm"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{statusMessage || "Processing..."}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>
                      {paymentMethod === "CASH_ON_DELIVERY"
                        ? "Confirm COD Order"
                        : `Pay Now ${formatCurrency(serverSummary.total)}`}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              {/* Status helper text when active */}
              {isProcessing && statusMessage && (
                <div className="text-center text-xs font-semibold text-emerald-700 animate-pulse">
                  {statusMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
