"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Users,
  MessageSquare,
  Scale,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  Globe,
  MapPin,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FarmerGroupItem {
  _id: string;
  name: string;
  description: string;
  product: string;
  category: string;
  location: {
    village?: string;
    district: string;
    state: string;
  };
  privacy: string;
  memberCount: number;
  postCount: number;
  aggregatedQuantityKg: number;
}

interface FpoGroupsTabProps {
  currentUserId: string;
  onSelectGroup: (groupId: string) => void;
}

export function FpoGroupsTab({ currentUserId, onSelectGroup }: FpoGroupsTabProps) {
  const [groups, setGroups] = useState<FarmerGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [membershipState, setMembershipState] = useState<Record<string, boolean>>({});

  // Create Group Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState("Fresh Vegetables");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("Ganjam");
  const [state, setState] = useState("Odisha");
  const [privacy, setPrivacy] = useState("PUBLIC");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [categoryFilter]);

  async function fetchGroups() {
    setLoading(true);
    try {
      let url = "/api/fpo/groups";
      if (categoryFilter !== "ALL") url += `?category=${encodeURIComponent(categoryFilter)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.groups) {
        setGroups(data.groups);
      }
    } catch (e) {
      console.error("Failed to load groups:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinToggle(groupId: string, isCurrentlyMember: boolean) {
    try {
      const endpoint = isCurrentlyMember
        ? `/api/fpo/groups/${groupId}/leave`
        : `/api/fpo/groups/${groupId}/join`;

      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setMembershipState((prev) => ({ ...prev, [groupId]: !isCurrentlyMember }));
        setGroups((prev) =>
          prev.map((g) =>
            g._id === groupId
              ? { ...g, memberCount: g.memberCount + (isCurrentlyMember ? -1 : 1) }
              : g
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle group join:", err);
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !product.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/fpo/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          product: product.trim(),
          category,
          village: village.trim(),
          district: district.trim(),
          state: state.trim(),
          privacy,
        }),
      });
      const data = await res.json();
      if (data.success && data.group) {
        setShowCreateModal(false);
        setName("");
        setDescription("");
        setProduct("");
        fetchGroups();
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setIsCreating(false);
    }
  }

  const categories = [
    "ALL",
    "Fresh Vegetables",
    "Fresh Fruits",
    "Grains & Cereals",
    "Spices & Condiments",
    "Pulses & Lentils",
  ];

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.product.toLowerCase().includes(q) ||
      g.location.district.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crop groups, districts, products..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Farmer Group</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
              categoryFilter === cat
                ? "bg-blue-700 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat === "ALL" ? "All Categories" : cat}
          </button>
        ))}
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
          <span>Loading farmer communities...</span>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No groups found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a crop-specific collective for your village or block to start pooling produce.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium text-xs hover:bg-blue-800 cursor-pointer"
          >
            Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((grp) => {
            const isMember = membershipState[grp._id] ?? true; // Default seeded active

            return (
              <div
                key={grp._id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                        {grp.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {grp.location.village ? `${grp.location.village}, ` : ""}
                          {grp.location.district}, {grp.location.state}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-bold bg-blue-50 text-blue-800 shrink-0">
                      {grp.product}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {grp.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {/* Stats Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="block text-xs font-bold text-slate-900">{grp.memberCount}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Members</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="block text-xs font-bold text-slate-900">{grp.postCount}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Posts</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900">
                      <span className="block text-xs font-extrabold text-emerald-800">
                        {grp.aggregatedQuantityKg} kg
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">Pooled</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleJoinToggle(grp._id, isMember)}
                      className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs border transition-colors cursor-pointer ${
                        isMember
                          ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      {isMember ? "Joined (Leave)" : "+ Join Group"}
                    </button>

                    <button
                      onClick={() => onSelectGroup(grp._id)}
                      className="py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Enter Group</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Create New Farmer Collective Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aska Mustard Growers Association"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Crop / Product
                  </label>
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="e.g. Mustard, Potato, Chilli"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Fresh Vegetables">Fresh Vegetables</option>
                    <option value="Fresh Fruits">Fresh Fruits</option>
                    <option value="Grains & Cereals">Grains &amp; Cereals</option>
                    <option value="Spices & Condiments">Spices &amp; Condiments</option>
                    <option value="Pulses & Lentils">Pulses &amp; Lentils</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description &amp; Goals
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What is the objective of this group? (e.g. Joint mandi price negotiation, direct cold storage aggregation)..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Village</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Hinjili"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Ganjam"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Odisha"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !name.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Create Group</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
