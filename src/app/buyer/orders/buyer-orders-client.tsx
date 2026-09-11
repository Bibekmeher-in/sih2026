"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Truck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ChevronRight,
  Layers,
  Building2,
  Calendar,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { MarketProduct } from "@/config/demo-products";

interface BuyerOrderItem {
  product?: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalItemPrice: number;
  qualityGrade?: string;
}

interface BuyerOrder {
  _id: string;
  orderNumber: string;
  sellerName: string;
  sellerType: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  items?: BuyerOrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  carrierVehicle?: string;
  driverName?: string;
  driverPhone?: string;
  dispatchDate?: string;
  eta?: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  deliveryHub?: string;
  deliveryAddress?: {
    recipientName?: string;
    addressLine?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  createdAt: string;
}

interface BuyerOrdersClientProps {
  initialOrders: BuyerOrder[];
}

const ACTIVE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "ASSIGNED_FOR_DELIVERY",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
];

const PAST_STATUSES = ["DELIVERED", "CANCELLED"];

export function BuyerOrdersClient({ initialOrders }: BuyerOrdersClientProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PAST">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderFeedback, setReorderFeedback] = useState<{ id: string; message: string; success: boolean } | null>(null);

  const activeOrders = useMemo(
    () => initialOrders.filter((o) => ACTIVE_STATUSES.includes(o.orderStatus)),
    [initialOrders]
  );

  const pastOrders = useMemo(
    () => initialOrders.filter((o) => PAST_STATUSES.includes(o.orderStatus)),
    [initialOrders]
  );

  const currentList = activeTab === "ACTIVE" ? activeOrders : pastOrders;

  const filteredOrders = useMemo(() => {
    let list = [...currentList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.sellerName.toLowerCase().includes(q) ||
          o.productName.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((o) => o.orderStatus === statusFilter);
    }

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "NEWEST" ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [currentList, searchQuery, statusFilter, sortOrder]);

  const handleBuyAgain = async (order: BuyerOrder) => {
    setReorderingId(order._id);
    setReorderFeedback(null);

    try {
      const orderItems = order.items && order.items.length > 0 ? order.items : [{
        product: "",
        productName: order.productName,
        quantity: order.quantity,
        unit: order.unit,
        unitPrice: order.unitPrice,
        totalItemPrice: order.total,
      }];

      let added = 0;
      for (const item of orderItems) {
        if (!item.product) continue;
        const res = await fetch(`/api/products/${item.product}`);
        if (res.ok) {
          const data = await res.json();
          const prod = data.product;
          if (prod && prod.status !== "ARCHIVED" && prod.availableQuantity > 0) {
            addItem(
              prod as unknown as MarketProduct,
              Math.min(item.quantity, prod.availableQuantity)
            );
            added++;
          }
        }
      }

      if (added > 0) {
        setReorderFeedback({
          id: order._id,
          message: `Added ${added} wholesale lot(s) to procurement cart with live prices.`,
          success: true,
        });
        setTimeout(() => {
          router.push("/consumer/cart");
        }, 1200);
      } else {
        setReorderFeedback({
          id: order._id,
          message: "Produce lot from this harvest is currently unavailable for wholesale reorder.",
          success: false,
        });
      }
    } catch {
      setReorderFeedback({
        id: order._id,
        message: "Failed to reorder bulk lot.",
        success: false,
      });
    } finally {
      setReorderingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">PO SUBMITTED</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold">CONFIRMED</Badge>;
      case "PROCESSING":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold">AGGREGATION &amp; PACKING</Badge>;
      case "READY_FOR_PICKUP":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] font-bold">READY AT HUB</Badge>;
      case "PICKED_UP":
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 text-[10px] font-bold">FLEET LOADED</Badge>;
      case "IN_TRANSIT":
        return (
          <Badge className="bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1">
            <Truck className="h-3 w-3 animate-pulse" />
            <span>IN TRANSIT</span>
          </Badge>
        );
      case "OUT_FOR_DELIVERY":
        return (
          <Badge className="bg-teal-600 text-white font-bold text-[10px] flex items-center gap-1">
            <Truck className="h-3 w-3 animate-bounce" />
            <span>ARRIVING TODAY</span>
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>DELIVERED</span>
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-bold flex items-center gap-1">
            <XCircle className="h-3 w-3 text-rose-600" />
            <span>CANCELLED</span>
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="agri-container space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Wholesale Purchase Orders</h1>
          <p className="text-xs text-slate-500">
            Monitor institutional B2B contracts, cold-chain transport logistics, and escrow disbursement
          </p>
        </div>

        <Link href="/buyer/requirements">
          <Button
            variant="outline"
            className="border-slate-300 text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-semibold gap-1.5 self-start sm:self-auto"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Post Sourcing RFQ</span>
          </Button>
        </Link>
      </div>

      {/* Tabs: Active vs Past */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveTab("ACTIVE");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "ACTIVE"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Active Contracts</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              activeTab === "ACTIVE" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {activeOrders.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("PAST");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "PAST"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Past Purchase Orders</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              activeTab === "PAST" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {pastOrders.length}
          </span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order number, wholesale crop, or FPO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {activeTab === "PAST" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="ALL">All Past Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}

          {activeTab === "ACTIVE" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="ALL">All Active Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            </select>
          )}

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "NEWEST" | "OLDEST")}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <Truck className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {activeTab === "ACTIVE" ? "No Active Contracts" : "No Past Orders"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "ACTIVE"
              ? "You do not have any active wholesale shipments in transit or aggregation."
              : "No historical purchase orders matched your search criteria."}
          </p>
          <Link href="/buyer/requirements">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs mt-2">
              Post Procurement RFQ
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const isDelivered = o.orderStatus === "DELIVERED";
            const isCancelled = o.orderStatus === "CANCELLED";

            return (
              <div
                key={o._id}
                className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-400 transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      #{o.orderNumber}
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>
                        Created {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(o.orderStatus)}
                    <Badge variant="outline" className="text-[10px] text-emerald-800 border-emerald-300 font-mono">
                      {o.paymentStatus}
                    </Badge>
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  {/* Wholesale Lot */}
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Wholesale Produce</span>
                    <div className="font-bold text-slate-900 text-sm">{o.productName}</div>
                    <p className="text-slate-600 font-semibold">
                      Total Volume: {o.quantity} {o.unit}
                    </p>
                  </div>

                  {/* Supplier Info */}
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Supplier / Aggregator</span>
                    <div className="font-semibold text-slate-900">{o.sellerName}</div>
                    <Badge variant="outline" className="text-[10px] text-slate-600">
                      {o.sellerType}
                    </Badge>
                  </div>

                  {/* Delivery & Fleet */}
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Delivery Status</span>
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      <Truck className="h-3 w-3 text-slate-500" />
                      <span>{o.carrierVehicle || "OD-02-CD-5678 (Eicher Pro Reefer)"}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] flex items-center gap-1">
                      <Clock className="h-3 w-3 text-emerald-600" />
                      <span>
                        {isDelivered
                          ? "Delivered"
                          : isCancelled
                          ? "Cancelled"
                          : o.estimatedDeliveryAt
                          ? "Estimated: 24-48 hours"
                          : "In preparation"}
                      </span>
                    </p>
                  </div>

                  {/* Total & Action Buttons */}
                  <div className="flex flex-col md:items-end justify-between gap-2">
                    <div className="md:text-right">
                      <span className="text-slate-400 uppercase text-[10px] font-bold">Contract Total</span>
                      <div className="text-base font-black text-slate-900">
                        {formatCurrency(o.total)}
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Hub: {o.deliveryHub || "Bhubaneswar Hub"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {activeTab === "PAST" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reorderingId === o._id}
                          onClick={() => handleBuyAgain(o)}
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs gap-1"
                        >
                          {reorderingId === o._id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-slate-600" />
                          ) : (
                            <RotateCcw className="h-3 w-3 text-slate-600" />
                          )}
                          <span>Buy Again</span>
                        </Button>
                      )}

                      <Link href={`/buyer/orders/${o._id}`} className="w-full md:w-auto">
                        <Button
                          size="sm"
                          className={`w-full md:w-auto rounded-xl text-xs gap-1.5 font-bold ${
                            activeTab === "ACTIVE"
                              ? "bg-slate-900 hover:bg-slate-800 text-white"
                              : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {activeTab === "ACTIVE" ? (
                            <>
                              <Truck className="h-3.5 w-3.5" />
                              <span>Track Order</span>
                            </>
                          ) : (
                            <>
                              <span>View Details</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Reorder feedback notice */}
                {reorderFeedback && reorderFeedback.id === o._id && (
                  <div
                    className={`rounded-xl p-2.5 text-xs flex items-center gap-2 ${
                      reorderFeedback.success
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-amber-50 border border-amber-200 text-amber-800"
                    }`}
                  >
                    {reorderFeedback.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ShoppingBag className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <span>{reorderFeedback.message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
