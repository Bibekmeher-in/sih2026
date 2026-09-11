"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  PackageCheck,
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  MapPin,
  AlertTriangle,
  RotateCcw,
  Truck,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";
import { useRazorpay } from "@/hooks/use-razorpay";

export default function BuyerCheckoutPage() {
  const { data: session } = useSession();
  const { items, removeItem, updateQuantity, clearCart, serverSummary, isValidating } = useCart();
  const { openCheckout } = useRazorpay();

  // Delivery Address Form
  const [recipientName, setRecipientName] = useState("Enterprise Sourcing Dept");
  const [recipientPhone, setRecipientPhone] = useState("9876543210");
  const [addressLine, setAddressLine] = useState("Warehouse 14, MIDC Agro Industrial Estate");
  const [district, setDistrict] = useState("Pune");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("411028");

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<
    "UPI" | "CARD" | "NET_BANKING" | "CASH_ON_DELIVERY"
  >("NET_BANKING");

  // Flow states
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [cancellationNotice, setCancellationNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    orderNumber: string;
    total: number;
    paymentMethod: string;
    isCOD: boolean;
  } | null>(null);

  useEffect(() => {
    if (session?.user?.name && recipientName === "Enterprise Sourcing Dept") {
      setRecipientName(session.user.name);
    }
    if (session?.user?.phone && recipientPhone === "9876543210") {
      setRecipientPhone(session.user.phone);
    }
  }, [session]);

  const handlePlaceOrder = async (isRetry = false) => {
    setErrorMessage(null);
    setCancellationNotice(null);

    if (items.length === 0) {
      setErrorMessage("No wholesale lots in procurement cart. Please add lots to proceed.");
      return;
    }

    if (!recipientName || !recipientPhone || !addressLine || !district || !state || !pincode) {
      setErrorMessage("Please complete all warehouse delivery details.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. CASH ON DELIVERY / OFFLINE SETTLEMENT FLOW
      if (paymentMethod === "CASH_ON_DELIVERY") {
        setStatusMessage("Confirming Purchase Order for COD/Logistics Dispatch...");

        const res = await fetch("/api/buyer/orders", {
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
            paymentMethod: "CASH_ON_DELIVERY",
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to place wholesale purchase order.");
        }

        clearCart();
        setConfirmedOrder({
          id: data.order._id,
          orderNumber: data.order.orderNumber,
          total: data.order.total,
          paymentMethod: "CASH_ON_DELIVERY",
          isCOD: true,
        });
        setIsProcessing(false);
        return;
      }

      // 2. ONLINE PAYMENT / ESCROW GATEWAY VIA RAZORPAY
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
        buyerType: "BULK_BUYER",
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
        name: "KisanDirect B2B Escrow",
        description: `Wholesale PO #${initData.orderNumber}`,
        order_id: initData.razorpayOrderId,
        prefill: {
          name: initData.customer?.name || recipientName,
          email: initData.customer?.email || session?.user?.email || "buyer@kisandirect.in",
          contact: initData.customer?.contact || recipientPhone,
        },
        theme: { color: "#0f172a" }, // Dark slate for B2B theme
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
          setErrorMessage(err.description || "Payment failed or declined by banking network. You can retry.");
        },
        onDismiss: () => {
          // Razorpay closed without payment: DO NOT confirm order!
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

  if (confirmedOrder) {
    return (
      <div className="agri-container max-w-lg py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-slate-900 text-white flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>

          <Badge variant="outline" className="text-xs uppercase font-bold py-0.5 border-slate-300">
            {confirmedOrder.isCOD
              ? "Wholesale PO Confirmed — Payment Pending on Delivery"
              : "Payment Verified & Escrow Funded"}
          </Badge>

          <h2 className="text-2xl font-bold text-slate-900">
            {confirmedOrder.isCOD ? "Purchase Order Placed!" : "Escrow Payment Confirmed!"}
          </h2>
          <p className="text-xs text-slate-600">
            Purchase Order: <span className="font-mono font-bold text-slate-900">{confirmedOrder.orderNumber}</span>
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span>Order Status:</span>
              <span className="font-bold text-emerald-700">CONFIRMED</span>
            </div>
            <div className="flex justify-between">
              <span>Settlement Status:</span>
              <span className="font-bold text-slate-900">
                {confirmedOrder.isCOD ? "PENDING (Physical Invoice / COD)" : "CAPTURED (Escrow Secured)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Settlement Mode:</span>
              <span className="font-bold text-slate-800">{confirmedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Procurement:</span>
              <span className="font-black text-slate-900">{formatCurrency(confirmedOrder.total)}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white" asChild>
              <Link href="/buyer/orders">View in Purchase Orders</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/buyer/marketplace">Continue Procurement</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="agri-container max-w-md py-16 text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
          <PackageCheck className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Procurement Cart Empty</h2>
        <p className="text-xs text-slate-500">
          No wholesale lots currently selected for institutional procurement.
        </p>
        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white" asChild>
          <Link href="/buyer/marketplace">Browse Wholesale Lots</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="agri-container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/buyer/marketplace"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Lots</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Wholesale Procurement Checkout</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Lots, Destination, Payment Method */}
        <div className="lg:col-span-7 space-y-6">
          {/* Lots Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Procurement Lots ({items.length})
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
                    <span className="text-[10px] font-bold text-blue-700 uppercase">
                      {item.variety || item.qualityGrade}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-500">
                      Supplier: {item.sellerName} | ₹{item.price}/{item.unit}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="flex items-center border border-slate-300 rounded-lg bg-white">
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

                    <div className="text-sm font-bold text-slate-900 w-28 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-400 hover:text-red-600 p-1 disabled:opacity-30"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Warehouse Address */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="h-4 w-4 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">Warehouse / Receiving Dock</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Receiving Contact</label>
                <input
                  type="text"
                  disabled={isProcessing}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Dispatch Phone</label>
                <input
                  type="tel"
                  disabled={isProcessing}
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-600 mb-1 font-semibold">Warehouse Address</label>
                <input
                  type="text"
                  disabled={isProcessing}
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">District</label>
                <input
                  type="text"
                  disabled={isProcessing}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">State</label>
                <input
                  type="text"
                  disabled={isProcessing}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">PIN Code</label>
                <input
                  type="text"
                  disabled={isProcessing}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="h-4 w-4 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">Settlement Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod("NET_BANKING")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  paymentMethod === "NET_BANKING"
                    ? "border-slate-900 bg-slate-50 text-slate-900 ring-2 ring-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Building2 className="h-4 w-4 text-slate-900" />
                  <span>Net Banking / Escrow</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Corporate banking &amp; escrow transfer via Razorpay
                </div>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod("UPI")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  paymentMethod === "UPI"
                    ? "border-slate-900 bg-slate-50 text-slate-900 ring-2 ring-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <QrCode className="h-4 w-4 text-slate-900" />
                  <span>UPI Payment</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Instant QR / VPA settlement via Razorpay
                </div>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod("CARD")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  paymentMethod === "CARD"
                    ? "border-slate-900 bg-slate-50 text-slate-900 ring-2 ring-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <CreditCard className="h-4 w-4 text-slate-900" />
                  <span>Corporate Credit Card</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Visa / Mastercard / RuPay via Razorpay
                </div>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-slate-900 bg-slate-50 text-slate-900 ring-2 ring-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Banknote className="h-4 w-4 text-slate-900" />
                  <span>Pay on Receiving Dock (COD)</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Post-dispatch inspection settlement
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Billing Summary & Placement */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Purchase Order Billing Summary
            </h3>

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

            {/* Payment Dismissal Notice */}
            {cancellationNotice && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
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
                <span>Wholesale Subtotal</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(serverSummary.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-slate-400" />
                  <span>Fleet Freight</span>
                </span>
                <span className="font-bold text-slate-900">
                  {serverSummary.deliveryFee === 0
                    ? "FREE"
                    : formatCurrency(serverSummary.deliveryFee)}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-900">
                <span>Grand Total</span>
                <span className="text-slate-900">
                  {formatCurrency(serverSummary.total)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Escrow-Guaranteed B2B Procurement</span>
              </div>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                Wholesale payments are verified cryptographically via Razorpay. Direct farm-gate lots with quality certification.
              </p>
            </div>

            <Button
              size="lg"
              disabled={!serverSummary.valid || isValidating || items.length === 0 || isProcessing}
              onClick={() => handlePlaceOrder(false)}
              className="w-full font-bold text-base h-12 shadow-sm bg-slate-900 hover:bg-slate-800 text-white"
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
                      ? "Confirm Wholesale PO (COD)"
                      : `Authorize Payment (${formatCurrency(serverSummary.total)})`}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            {isProcessing && statusMessage && (
              <div className="text-center text-xs font-semibold text-slate-800 animate-pulse">
                {statusMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
