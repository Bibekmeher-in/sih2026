import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import {
  MapPin,
  ArrowRight,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function BuyerMarketplacePage() {
  await requireRole([USER_ROLES.BULK_BUYER]);

  // Fetch real wholesale products from DB (high-volume availability)
  let wholesaleProducts: {
    _id: string;
    name: string;
    variety?: string;
    category?: { name?: string };
    price: number;
    unit: string;
    mandiBenchmarkPrice?: number;
    availableQuantity: number;
    minimumOrderQuantity: number;
    sellerName?: string;
    sellerType?: string;
    location?: { district?: string; state?: string };
  }[] = [];

  try {
    await connectToDatabase();
    const dbProducts = await Product.find({
      status: "AVAILABLE",
      availableQuantity: { $gte: 100 },
    })
      .populate("category", "name")
      .sort({ availableQuantity: -1 })
      .limit(20)
      .lean();

    wholesaleProducts = dbProducts.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      variety: p.variety,
      category: p.category && typeof p.category === "object" && "name" in p.category
        ? { name: String((p.category as { name: unknown }).name) }
        : undefined,
      price: p.price,
      unit: p.unit,
      mandiBenchmarkPrice: p.mandiBenchmarkPrice,
      availableQuantity: p.availableQuantity,
      minimumOrderQuantity: p.minimumOrderQuantity,
      sellerName: p.sellerName,
      sellerType: p.sellerType,
      location: p.location,
    }));
  } catch {
    // DB offline — show empty state
  }

  return (
    <div className="agri-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Wholesale Farm Produce Lots</h1>
          <p className="text-xs text-slate-500">
            Metric-ton and quintal procurement direct from certified Horticulture FPOs &amp; progressive farmers
          </p>
        </div>

        <Link href="/buyer/requirements">
          <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs gap-1.5 self-start sm:self-auto">
            <span>Cannot find your volume? Post an RFQ</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {wholesaleProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {wholesaleProducts.map((p) => {
            const tonPrice = (p.price * 1000).toLocaleString("en-IN");
            const isFpo = p.sellerType === "FPO";

            return (
              <div
                key={p._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        isFpo
                          ? "text-blue-700 border-blue-300 bg-blue-50"
                          : "text-emerald-700 border-emerald-300 bg-emerald-50"
                      }`}
                    >
                      {isFpo ? "FPO Aggregation Lot" : "Direct Farm Gate"}
                    </Badge>
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {p.location?.district}, {p.location?.state}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.variety || p.category?.name}</p>
                  </div>

                  {/* Price Matrix */}
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500">Bulk Rate:</span>
                      <div>
                        <span className="text-lg font-black text-slate-900">₹{p.price}</span>
                        <span className="text-slate-500 font-medium">/{p.unit}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Metric Ton Price:</span>
                      <span className="font-bold text-slate-800">₹{tonPrice} / Ton</span>
                    </div>
                    {p.mandiBenchmarkPrice && (
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>APMC Benchmark:</span>
                        <span className="text-slate-400 line-through">₹{p.mandiBenchmarkPrice}/{p.unit}</span>
                      </div>
                    )}
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div className="rounded-lg bg-slate-50 p-2 text-center">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Available Stock</span>
                      <span className="font-bold text-slate-900">
                        {(p.availableQuantity / 1000).toFixed(1)} Tons ({p.availableQuantity} kg)
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 text-center">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Minimum Order</span>
                      <span className="font-bold text-slate-900">
                        {p.minimumOrderQuantity} {p.unit}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 pt-1">
                    Supplier: <span className="font-semibold text-slate-800">{p.sellerName}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link href={`/marketplace/${p._id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full rounded-xl text-xs border-slate-300 hover:bg-slate-50">
                      Inspect Lot
                    </Button>
                  </Link>
                  <Link href="/buyer/requirements" className="flex-1">
                    <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold">
                      Bulk RFQ
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Package className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-700">No wholesale lots available yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Farmers and FPOs will publish bulk harvest lots soon. You can post an RFQ in the meantime.
          </p>
          <Link href="/buyer/requirements" className="mt-4 inline-block">
            <Button className="bg-slate-900 text-white rounded-xl text-xs mt-2 gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" />
              Post a Bulk RFQ
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
