"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PackageCheck,
  Truck,
  ArrowRight,
  Store,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Layers,
  ChevronRight,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { MarketProduct } from "@/config/demo-products";

interface OrderItemSummary {
  product?: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalItemPrice: number;
}

interface ConsumerOrder {
  _id: string;
  orderNumber: string;
  sellerName: string;
  sellerType: string;
  sellerPhone?: string;
  items: OrderItemSummary[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  orderStatus: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  deliveryAddress?: {
    recipientName?: string;
    recipientPhone?: string;
    addressLine?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  createdAt: string;
}

interface OrdersClientProps {
  initialOrders: ConsumerOrder[];
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

export function ConsumerOrdersClient({ initialOrders }: OrdersClientProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PAST">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderFeedback, setReorderFeedback] = useState<{ id: string; message: string; success: boolean } | null>(null);

  // Split into Active and Past
  const activeOrdersList = useMemo(
    () => initialOrders.filter((o) => ACTIVE_STATUSES.includes(o.orderStatus)),
    [initialOrders]
  );

  const pastOrdersList = useMemo(
    () => initialOrders.filter((o) => PAST_STATUSES.includes(o.orderStatus)),
    [initialOrders]
  );

  const currentList = activeTab === "ACTIVE" ? activeOrdersList : pastOrdersList;

  // Search, filter, and sort
  const filteredOrders = useMemo(() => {
    let list = [...currentList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.sellerName.toLowerCase().includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q))
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

  const handleBuyAgain = async (order: ConsumerOrder) => {
    setReorderingId(order._id);
    setReorderFeedback(null);

    try {
      let addedCount = 0;

      for (const item of order.items) {
        if (!item.product) continue;

        // Fetch current product price & availability from MongoDB
        const res = await fetch(`/api/products/${item.product}`);
        if (!res.ok) continue;

        const data = await res.json();
        const currentProduct = data.product;

        if (!currentProduct || currentProduct.status === "ARCHIVED" || currentProduct.availableQuantity <= 0) {
          continue;
        }

        // Add with current price (never reuse historical order price)
        addItem(
          currentProduct as unknown as MarketProduct,
          Math.min(item.quantity, currentProduct.availableQuantity)
        );

        addedCount++;
      }

      if (addedCount > 0) {
        setReorderFeedback({
          id: order._id,
          message: `Added ${addedCount} available item(s) to your cart with current farm prices.`,
          success: true,
        });
        setTimeout(() => {
          router.push("/consumer/cart");
        }, 1200);
      } else {
        setReorderFeedback({
          id: order._id,
          message: "Products from this past harvest are currently out of stock.",
          success: false,
        });
      }
    } catch {
      setReorderFeedback({
        id: order._id,
        message: "Failed to reorder produce lots. Please check catalog.",
        success: false,
      });
    } finally {
      setReorderingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">ORDER PLACED</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold">CONFIRMED</Badge>;
      case "PROCESSING":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold">BEING PREPARED</Badge>;
      case "READY_FOR_PICKUP":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] font-bold">READY FOR PICKUP</Badge>;
      case "PICKED_UP":
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 text-[10px] font-bold">PICKED UP</Badge>;
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
            <span>OUT FOR DELIVERY</span>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Farm Orders</h1>
          <p className="text-xs text-slate-500">
            Track active shipments, inspect past harvest receipts, and reorder fresh produce
          </p>
        </div>

        <Link href="/marketplace">
          <Button
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-semibold gap-1.5 self-start sm:self-auto"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Browse Farm Marketplace</span>
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
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Active Orders</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              activeTab === "ACTIVE" ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {activeOrdersList.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("PAST");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "PAST"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Past Orders</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              activeTab === "PAST" ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {pastOrdersList.length}
          </span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order number, crop name, or grower..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-emerald-600 placeholder:text-slate-400"
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
          <PackageCheck className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {activeTab === "ACTIVE" ? "No Active Shipments" : "No Past Orders Found"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "ACTIVE"
              ? "You do not have any orders currently in transit or preparation."
              : "No historical orders match your search filters."}
          </p>
          <Link href="/marketplace">
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs mt-2">
              Explore Farm Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const isDelivered = o.orderStatus === "DELIVERED";
            const isCancelled = o.orderStatus === "CANCELLED";
            const firstItem = o.items[0];

            return (
              <div
                key={o._id}
                className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      #{o.orderNumber}
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  {/* Produce summary */}
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Produce Lots</span>
                    <div className="font-bold text-slate-900 text-sm">
                      {firstItem ? `${firstItem.productName} • ${firstItem.quantity} ${firstItem.unit}` : "Fresh Produce"}
                    </div>
                    {o.items.length > 1 && (
                      <p className="text-slate-500 text-[11px]">
                        +{o.items.length - 1} more item(s) in lot
                      </p>
                    )}
                  </div>

                  {/* Seller / Farm */}
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Grower / Seller</span>
                    <div className="font-semibold text-slate-900">{o.sellerName}</div>
                    <p className="text-slate-500">
                      Destination: {o.deliveryAddress?.district || "Local Hub"}, {o.deliveryAddress?.state || "Odisha"}
                    </p>
                  </div>

                  {/* Estimated or Delivered Date */}
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">
                      {isDelivered ? "Delivered Date" : isCancelled ? "Cancelled Date" : "Estimated Arrival"}
                    </span>
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-emerald-600" />
                      <span>
                        {isDelivered && o.deliveredAt
                          ? new Date(o.deliveredAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : isCancelled
                          ? "Cancelled"
                          : o.estimatedDeliveryAt
                          ? "Today"
                          : "Scheduled in dispatch"}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Mode: <span className="font-medium text-slate-700">{o.paymentMethod || "UPI"}</span>
                    </p>
                  </div>

                  {/* Total & Action Buttons */}
                  <div className="flex flex-col sm:items-end justify-between gap-2">
                    <div className="sm:text-right">
                      <span className="text-slate-400 uppercase text-[10px] font-bold">Order Total</span>
                      <div className="text-base font-black text-emerald-800">
                        {formatCurrency(o.total)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Buy Again button for past orders */}
                      {activeTab === "PAST" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reorderingId === o._id}
                          onClick={() => handleBuyAgain(o)}
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs gap-1"
                        >
                          {reorderingId === o._id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                          ) : (
                            <RotateCcw className="h-3 w-3 text-emerald-600" />
                          )}
                          <span>Buy Again</span>
                        </Button>
                      )}

                      {/* Track / Details button */}
                      <Link href={`/consumer/orders/${o._id}`} className="w-full sm:w-auto">
                        <Button
                          size="sm"
                          className={`w-full sm:w-auto rounded-xl text-xs gap-1.5 font-bold ${
                            activeTab === "ACTIVE"
                              ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                              : "border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
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

                {/* Buy Again Feedback Notification */}
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
