"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Star,
  Phone,
  Search,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Supplier {
  _id: string;
  name: string;
  type: string;
  district: string;
  state: string;
  memberFarmersCount?: number;
  landAreaAcres?: number;
  primaryCrops: string[];
  availableVolumeTonnes: number;
  qualityCertifications: string[];
  rating: number;
  ordersCompleted: number;
  phone: string;
  contactPerson: string;
  verified: boolean;
}

export function SuppliersClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers] = useState<Supplier[]>(initialSuppliers);
  const [searchCrop, setSearchCrop] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesCrop =
      !searchCrop ||
      s.primaryCrops.some((c) => c.toLowerCase().includes(searchCrop.toLowerCase())) ||
      s.name.toLowerCase().includes(searchCrop.toLowerCase());

    const matchesType = selectedType === "ALL" || s.type === selectedType;
    const matchesDistrict = selectedDistrict === "ALL" || s.district === selectedDistrict;

    return matchesCrop && matchesType && matchesDistrict;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Verified Horticultural Suppliers</h1>
        <p className="text-xs text-slate-500">
          Source directly from audited Farmer Producer Organizations (FPOs) and certified horticulture growers
        </p>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by crop (e.g. Onion, Tomato, Potato) or FPO name..."
            value={searchCrop}
            onChange={(e) => setSearchCrop(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-slate-900"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Seller Types (FPO &amp; Farmer)</option>
            <option value="FPO">FPO Federations Only</option>
            <option value="Farmer">Individual Progressive Farmers</option>
          </select>
        </div>

        <div>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Districts (Maharashtra)</option>
            <option value="Nashik">Nashik Cluster</option>
            <option value="Pune">Pune Cluster</option>
            <option value="Ahmednagar">Ahmednagar Cluster</option>
          </select>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSuppliers.map((sup) => (
          <div
            key={sup._id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{sup.name}</h3>
                    <Badge variant="outline" className="text-[10px] text-slate-700 border-slate-300">
                      {sup.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{sup.district}, {sup.state}</span>
                    {sup.memberFarmersCount && (
                      <span className="font-medium text-slate-700">
                        • {sup.memberFarmersCount} Member Growers
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-1 rounded-lg text-xs font-bold border border-amber-200">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>{sup.rating}</span>
                </div>
              </div>

              {/* Primary Crops Pills */}
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Crops Produced</span>
                <div className="flex flex-wrap gap-1.5">
                  {sup.primaryCrops.map((crop, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[11px] font-medium bg-slate-100 text-slate-800">
                      {crop}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Quality Certifications */}
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Audited Certifications</span>
                <div className="flex flex-wrap gap-1.5">
                  {sup.qualityCertifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>{cert}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Capacity Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold block">Available Capacity</span>
                  <span className="font-bold text-slate-900">
                    {sup.availableVolumeTonnes} Metric Tonnes
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] font-bold block">Orders Fulfilled</span>
                  <span className="font-bold text-emerald-800">
                    {sup.ordersCompleted} Commercial Dispatches
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-800">{sup.contactPerson}</div>
                <div className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{sup.phone}</span>
                </div>
              </div>

              <Link href="/buyer/requirements">
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold gap-1">
                  <span>Send RFQ</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
