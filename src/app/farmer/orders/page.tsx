"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/skeletons";
import { ErrorDisplay } from "@/components/ui/error-display";
import { EmptyState } from "@/components/ui/empty-state";

interface OrderItem {
  _id: string;
  orderNumber: string;
  buyerName: string;
  buyerType: string;
  buyerPhone: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  deliveryAddress?: {
    addressLine: string;
    district: string;
    state: string;
    pincode: string;
  };
}

const STATUS_PROGRESSION: Record<string, string> = {
  CONFIRMED: "PROCESSING",
  PROCESSING: "ASSIGNED_FOR_DELIVERY",
  ASSIGNED_FOR_DELIVERY: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

export default function FarmerOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/farmer/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = STATUS_PROGRESSION[currentStatus] || "DELIVERED";
    setUpdatingId(orderId);

    try {
      const res = await fetch(`/api/farmer/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  orderStatus: nextStatus,
                  paymentStatus: nextStatus === "DELIVERED" ? "RELEASED_TO_SELLER" : o.paymentStatus,
                }
              : o
          )
        );
      }
    } catch (err) {
      console.error("Error updating order:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      o.productName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || o.orderStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Incoming Orders &amp; Fulfillment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Track buyer purchases, advance harvest packing status, and coordinate dispatch
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full w-full sm:w-auto scrollbar-none min-w-0">
          {["ALL", "CONFIRMED", "PROCESSING", "ASSIGNED_FOR_DELIVERY", "IN_TRANSIT", "DELIVERED"].map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterStatus === status
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {status === "ALL" ? "All Orders" : status.replace(/_/g, " ")}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID, buyer, crop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
      </div>

      {/* Orders Grid / Cards */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : error ? (
        <ErrorDisplay
          message="Unable to load orders. Check your connection and try again."
          retry={loadOrders}
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={Package}
          title={orders.length === 0 ? "No incoming orders yet" : "No orders match this filter"}
          description={
            orders.length === 0
              ? "When buyers purchase your produce from the marketplace, their orders will appear here."
              : "Try adjusting the filter or search term to find specific orders."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => {
            const isUpdating = updatingId === order._id;
            const nextStatus = STATUS_PROGRESSION[order.orderStatus];

            return (
              <div
                key={order._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-xs transition-all space-y-4"
              >
                {/* Top Row: Order ID, Date, Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {order.orderNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold text-slate-600 bg-slate-50"
                    >
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        order.paymentStatus === "RELEASED_TO_SELLER" ||
                        order.paymentStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      <ShieldCheck className="h-3 w-3 mr-1 inline" />
                      {order.paymentStatus.replace(/_/g, " ")}
                    </Badge>

                    <Badge
                      variant={
                        order.orderStatus === "DELIVERED"
                          ? "secondary"
                          : order.orderStatus === "IN_TRANSIT"
                          ? "default"
                          : "outline"
                      }
                      className={
                        order.orderStatus === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.orderStatus === "IN_TRANSIT"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      {order.orderStatus.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                {/* Middle Content: Produce & Buyer Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Produce Information */}
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Produce Lot</span>
                    <div className="font-bold text-slate-900 text-sm">
                      {order.productName}
                    </div>
                    <div className="text-slate-600">
                      Quantity:{" "}
                      <span className="font-mono font-bold text-slate-900">
                        {order.quantity.toLocaleString("en-IN")} {order.unit}
                      </span>{" "}
                      @ ₹{order.unitPrice}/{order.unit}
                    </div>
                  </div>

                  {/* Buyer Information */}
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Buyer Details</span>
                    <div className="font-bold text-slate-900">{order.buyerName}</div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span className="font-mono">{order.buyerPhone}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {order.buyerType === "BULK_BUYER" ? "Institutional Buyer" : "Direct Consumer"}
                    </Badge>
                  </div>

                  {/* Delivery Destination */}
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Delivery Destination</span>
                    {order.deliveryAddress ? (
                      <div className="text-slate-700 flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <p>{order.deliveryAddress.addressLine}</p>
                          <p className="text-slate-500">
                            {order.deliveryAddress.district}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500">Farm Gate Direct Pickup</p>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Total & Action Progression */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Order Net Total:</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <div className="w-full sm:w-auto">
                    {order.orderStatus === "DELIVERED" ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 justify-center sm:justify-start">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Order Fulfilled &amp; Payment Released</span>
                      </div>
                    ) : nextStatus ? (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleAdvanceStatus(order._id, order.orderStatus)}
                        className="w-full sm:w-auto h-8 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800"
                      >
                        {isUpdating ? (
                          <Clock className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Truck className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        <span>
                          Advance to {nextStatus.replace(/_/g, " ")}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
