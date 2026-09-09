"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  _id: string;
  orderNumber: string;
  buyer?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  seller?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  buyerType: string;
  items: Array<{
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalItemPrice: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryAddress: {
    recipientName: string;
    recipientPhone: string;
    addressLine: string;
    district: string;
    state: string;
    pincode: string;
  };
  notes?: string;
  createdAt: string;
}

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status && status !== "ALL") params.append("status", status);
      if (paymentStatus && paymentStatus !== "ALL") params.append("paymentStatus", paymentStatus);
      params.append("page", page.toString());
      params.append("limit", "15");

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setOrders(result.data.orders);
        setTotalPages(result.data.pagination.totalPages || 1);
        setTotalCount(result.data.pagination.total || 0);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }, [search, status, paymentStatus, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
        }
        setNotification(`Order status updated to ${newStatus}`);
        setTimeout(() => setNotification(null), 3000);
      } else {
        alert(result.message || "Failed to update order status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating order status");
    } finally {
      setActionLoading(null);
    }
  };

  const getOrderStatusBadge = (s: string) => {
    switch (s) {
      case "DELIVERED":
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">Delivered</Badge>;
      case "IN_TRANSIT":
        return <Badge className="bg-blue-50 text-blue-800 border-blue-300 text-[10px]">In Transit</Badge>;
      case "READY_FOR_PICKUP":
      case "ASSIGNED_FOR_DELIVERY":
        return <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px]">Pickup Assigned</Badge>;
      case "PROCESSING":
      case "CONFIRMED":
        return <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[10px]">Processing</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
    }
  };

  const getPaymentBadge = (p: string) => {
    switch (p) {
      case "PAID":
      case "ESCROW_HELD":
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">Escrow Held</Badge>;
      case "RELEASED_TO_SELLER":
        return <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[10px]">Settled to Farmer</Badge>;
      case "REFUNDED":
        return <Badge variant="destructive" className="text-[10px]">Refunded</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{p}</Badge>;
    }
  };

  return (
    <div className="agri-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            National Order Fulfillment Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Zero-trust state machine verification, escrow monitoring &amp; delivery assignment • Total Orders: {totalCount}
          </p>
        </div>

        {notification && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search order number, product, recipient..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Escrow States</option>
              <option value="ESCROW_HELD">Escrow Held</option>
              <option value="PAID">Paid</option>
              <option value="RELEASED_TO_SELLER">Released to Seller</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Buyer &amp; Type</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Items / Total</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Escrow Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-500" />
                    <span>Loading order transactions...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No orders matching search criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">{o.orderNumber}</div>
                      <div className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-semibold text-slate-800">{o.buyer?.name || "Consumer"}</div>
                      <div className="text-[10px] text-slate-400">{o.buyerType}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-semibold text-slate-800">{o.seller?.name || "Farmer"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{formatCurrency(o.total)}</div>
                      <div className="text-[10px] text-slate-400">
                        {o.items.length} line item(s)
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getOrderStatusBadge(o.orderStatus)}</td>
                    <td className="py-3.5 px-4">{getPaymentBadge(o.paymentStatus)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrder(o);
                          setOrderModalOpen(true);
                        }}
                        className="h-7 px-2 text-xs text-slate-700 hover:text-slate-900"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        <span>Inspect</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2.5 text-xs rounded-lg"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2.5 text-xs rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {orderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Order: {selectedOrder.orderNumber}</span>
                  {getOrderStatusBadge(selectedOrder.orderStatus)}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Ordered Produce Items
              </span>
              <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-3 border border-slate-200">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{it.productName}</span>
                      <span className="text-[11px] text-slate-400 block">
                        {it.quantity} {it.unit} × ₹{it.unitPrice}/{it.unit}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(it.totalItemPrice)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 flex items-center justify-between font-bold text-xs text-slate-900 border-t border-slate-200">
                  <span>Total (Incl. ₹{selectedOrder.deliveryFee} Freight):</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Delivery & Escrow Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Destination Address</span>
                <p className="text-slate-700">{selectedOrder.deliveryAddress?.recipientName}</p>
                <p className="text-slate-500 text-[11px]">{selectedOrder.deliveryAddress?.addressLine}</p>
                <p className="text-slate-500 text-[11px]">
                  {selectedOrder.deliveryAddress?.district}, {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.pincode}
                </p>
                <p className="text-slate-500 text-[11px] mt-1">Phone: {selectedOrder.deliveryAddress?.recipientPhone}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Escrow Settlement</span>
                <p className="text-slate-700">Method: {selectedOrder.paymentMethod}</p>
                <p className="text-slate-700">Status: {selectedOrder.paymentStatus}</p>
                <div className="mt-2">
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300">
                    B2B Protected Transaction
                  </Badge>
                </div>
              </div>
            </div>

            {/* Admin Override Controls */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Advance Status:</span>
                <select
                  value={selectedOrder.orderStatus}
                  onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                  disabled={actionLoading === selectedOrder._id}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
