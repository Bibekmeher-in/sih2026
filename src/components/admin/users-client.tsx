"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Loader2,
  CheckCircle2,
  Eye,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";
  location?: {
    district?: string;
    state?: string;
  };
  createdAt: string;
}

interface UsersClientProps {
  initialRole?: string;
  title: string;
  subtitle: string;
}

export function AdminUsersClient({ initialRole = "ALL", title, subtitle }: UsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(initialRole);
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (role && role !== "ALL") params.append("role", role);
      if (status && status !== "ALL") params.append("status", status);
      params.append("page", page.toString());
      params.append("limit", "15");

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setUsers(result.data.users);
        setTotalPages(result.data.pagination.totalPages || 1);
        setTotalCount(result.data.pagination.total || 0);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, [search, role, status, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, status: newStatus as UserItem["status"] } : u))
        );
        setNotification(`Account status updated to ${newStatus}`);
        setTimeout(() => setNotification(null), 3000);
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating user status");
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "FARMER":
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">Farmer</Badge>;
      case "FPO":
        return <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[10px]">FPO Cluster</Badge>;
      case "BULK_BUYER":
        return <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px]">Bulk Buyer</Badge>;
      case "CONSUMER":
        return <Badge className="bg-purple-50 text-purple-800 border-purple-200 text-[10px]">Consumer</Badge>;
      case "ADMIN":
        return <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-[10px]">Admin</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{r}</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "ACTIVE":
        return <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50/50 text-[10px]">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="outline" className="text-slate-600 border-slate-300 bg-slate-50 text-[10px]">Inactive</Badge>;
      case "SUSPENDED":
        return <Badge variant="destructive" className="text-[10px]">Suspended</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
    }
  };

  return (
    <div className="agri-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {subtitle} • Total Records: {totalCount}
          </p>
        </div>

        {notification && (
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs animate-in fade-in">
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
              placeholder="Search by name, email, phone, district..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Role Filter (if in generic view) */}
            {initialRole === "ALL" && (
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">All Roles</option>
                <option value="FARMER">Farmers</option>
                <option value="FPO">FPOs</option>
                <option value="BULK_BUYER">Bulk Buyers</option>
                <option value="CONSUMER">Consumers</option>
                <option value="ADMIN">Administrators</option>
              </select>
            )}

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-500" />
                    <span>Loading directory records...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No users matching the query parameters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u._id}</div>
                    </td>
                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.phone || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {u.location?.district ? `${u.location.district}, ${u.location.state}` : "—"}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(u.status)}</td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(u);
                            setUserModalOpen(true);
                          }}
                          className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>View</span>
                        </Button>

                        {u.status !== "ACTIVE" ? (
                          <Button
                            size="sm"
                            disabled={actionLoading === u._id}
                            onClick={() => handleStatusChange(u._id, "ACTIVE")}
                            className="h-7 px-2 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
                          >
                            {actionLoading === u._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Activate"
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actionLoading === u._id}
                            onClick={() => handleStatusChange(u._id, "SUSPENDED")}
                            className="h-7 px-2 text-[11px] rounded-lg"
                          >
                            {actionLoading === u._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Suspend"
                            )}
                          </Button>
                        )}
                      </div>
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

      {/* User Detail Modal */}
      {userModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-700" />
                <h3 className="font-bold text-sm text-slate-900">User Account Dossier</h3>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Full Name:</span>
                <span className="text-slate-900 font-bold text-sm">{selectedUser.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-semibold block">Account Role:</span>
                  <div className="mt-0.5">{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Status:</span>
                  <div className="mt-0.5">{getStatusBadge(selectedUser.status)}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Email:</span>
                <span className="text-slate-800 font-medium">{selectedUser.email}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Phone:</span>
                <span className="text-slate-800 font-medium">{selectedUser.phone || "Not provided"}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Location:</span>
                <span className="text-slate-800 font-medium">
                  {selectedUser.location?.district ? `${selectedUser.location.district}, ${selectedUser.location.state}` : "National"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Account ID:</span>
                <span className="font-mono text-slate-600 text-[11px]">{selectedUser._id}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserModalOpen(false)}
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
