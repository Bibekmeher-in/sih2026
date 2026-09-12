"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sprout,
  Save,
  ArrowLeft,
  IndianRupee,
  Layers,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { farmerProductFormSchema, FarmerProductFormInput } from "@/schemas";
import { useLanguage } from "@/context/language-context";
import { VoiceInputButton } from "@/components/shared/voice-input-button";

interface ProductFormProps {
  initialData?: Partial<FarmerProductFormInput> & { _id?: string };
  isEdit?: boolean;
}

const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Grains & Cereals",
  "Spices",
  "Pulses",
  "Dairy & Animal Husbandry",
];

export function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FarmerProductFormInput>({
    resolver: zodResolver(farmerProductFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      hindiName: initialData?.hindiName || "",
      variety: initialData?.variety || "",
      category: initialData?.category || "Vegetables",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      mandiBenchmarkPrice: initialData?.mandiBenchmarkPrice || 0,
      quantity: initialData?.quantity || 100,
      unit: (initialData?.unit as FarmerProductFormInput["unit"]) || "kg",
      qualityGrade: (initialData?.qualityGrade as FarmerProductFormInput["qualityGrade"]) || "Grade A",
      harvestDate:
        initialData?.harvestDate || new Date().toISOString().split("T")[0],
      district: initialData?.district || "Nashik",
      state: initialData?.state || "Maharashtra",
      minimumOrderQuantity: initialData?.minimumOrderQuantity || 20,
      status: (initialData?.status as FarmerProductFormInput["status"]) || "AVAILABLE",
    },
  });

  const watchPrice = useWatch({ control, name: "price" }) || 0;
  const watchMandiPrice = useWatch({ control, name: "mandiBenchmarkPrice" }) || 0;
  const calculatedPremium =
    watchMandiPrice > 0
      ? Math.round(((watchPrice - watchMandiPrice) / watchMandiPrice) * 100)
      : 0;

  const onSubmit = async (values: FarmerProductFormInput) => {
    setIsSubmitting(true);
    setServerError("");

    try {
      const url = isEdit
        ? `/api/farmer/products/${initialData?._id}`
        : "/api/farmer/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save produce listing");
      }

      router.push("/farmer/products");
      router.refresh();
    } catch (err: unknown) {
      setServerError((err as Error).message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
          {serverError}
        </div>
      )}

      {/* Section 1: Produce Identification */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sprout className="h-4 w-4 text-emerald-700" />
          <h2 className="text-base font-bold text-slate-900">Crop Identification</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                {t("farmerForm.cropName", "Crop Name (English)")} <span className="text-red-500">*</span>
              </label>
              <VoiceInputButton onTranscript={(txt) => setValue("name", txt)} size="sm" />
            </div>
            <input
              type="text"
              placeholder={t("farmerForm.cropNamePlaceholder", "e.g. Nashik Red Onion, Table Tomato, Pusa Basmati")}
              {...register("name")}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-700 text-xs"
            />
            {errors.name && (
              <p className="text-red-500 text-[11px] mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                {t("farmerForm.localName", "Regional / Local Name")}
              </label>
              <VoiceInputButton onTranscript={(txt) => setValue("hindiName", txt)} size="sm" />
            </div>
            <input
              type="text"
              placeholder={t("farmerForm.localNamePlaceholder", "e.g. ଟମାଟୋ / टमाटर")}
              {...register("hindiName")}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                {t("farmerForm.variety", "Cultivar / Seed Variety")}
              </label>
              <VoiceInputButton onTranscript={(txt) => setValue("variety", txt)} size="sm" />
            </div>
            <input
              type="text"
              placeholder={t("farmerForm.varietyPlaceholder", "e.g. Gavran Summer, Abhinav 1057, Pusa 1121")}
              {...register("variety")}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t("farmerForm.category", "Category")} <span className="text-red-500">*</span>
            </label>
            <select
              {...register("category")}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-[11px] mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t("farmerForm.qualityGrade", "Quality Grade")} <span className="text-red-500">*</span>
            </label>
            <select
              {...register("qualityGrade")}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white"
            >
              <option value="Grade A">Grade A (Export / Prime Uniform Size)</option>
              <option value="Grade B">Grade B (Standard Market Sort)</option>
              <option value="Premium Organic">Premium Certified Organic</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                {t("farmerForm.description", "Lot Description & Characteristics")} <span className="text-red-500">*</span>
              </label>
              <VoiceInputButton onTranscript={(txt) => setValue("description", txt)} size="sm" />
            </div>
            <textarea
              rows={3}
              placeholder={t("farmerForm.descriptionPlaceholder", "Describe soil conditioning, harvest freshness, post-harvest curing, grading process...")}
              {...register("description")}
              className="w-full p-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
            />
            {errors.description && (
              <p className="text-red-500 text-[11px] mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Pricing & Mandi Benchmark */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <IndianRupee className="h-4 w-4 text-emerald-700" />
          <h2 className="text-base font-bold text-slate-900">{t("farmerForm.pricingSection", "Pricing & Mandi Spread")}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t("farmerForm.price", "Direct Selling Price (₹)")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              {...register("price", { valueAsNumber: true })}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 font-bold font-mono text-xs"
            />
            {errors.price && (
              <p className="text-red-500 text-[11px] mt-1">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t("farmerForm.mandiBenchmark", "Local APMC Mandi Benchmark (₹)")}
            </label>
            <input
              type="number"
              step="0.5"
              {...register("mandiBenchmarkPrice", { valueAsNumber: true })}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t("farmerForm.unit", "Unit of Measurement")} <span className="text-red-500">*</span>
            </label>
            <select
              {...register("unit")}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs bg-white"
            >
              <option value="kg">kg (Kilograms)</option>
              <option value="quintal">quintal (100 kg)</option>
              <option value="crate">crate (20-25 kg)</option>
              <option value="ton">ton (1,000 kg)</option>
            </select>
          </div>
        </div>

        {/* Calculated Direct Premium Callout */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span className="text-emerald-900 font-medium">
              {t("farmerForm.directPremium", "Direct Farmer Premium over APMC Modal:")}
            </span>
          </div>
          <span className="font-bold text-emerald-800 font-mono text-sm">
            {calculatedPremium > 0 ? `+${calculatedPremium}% ${t("farmerForm.netGain", "Net Gain")}` : t("farmerForm.marketParity", "Market Parity")}
          </span>
        </div>
      </div>

      {/* Section 3: Harvest & Inventory Volume */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="h-4 w-4 text-emerald-700" />
          <h2 className="text-base font-bold text-slate-900">{t("farmerForm.inventorySection", "Inventory & Harvest Date")}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t("farmerForm.quantity", "Total Available Quantity")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("quantity", { valueAsNumber: true })}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 font-bold font-mono text-xs"
            />
            {errors.quantity && (
              <p className="text-red-500 text-[11px] mt-1">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t("farmerForm.moq", "Minimum Order Quantity (MOQ)")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("minimumOrderQuantity", { valueAsNumber: true })}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 font-mono text-xs"
            />
            {errors.minimumOrderQuantity && (
              <p className="text-red-500 text-[11px] mt-1">
                {errors.minimumOrderQuantity.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t("farmerForm.harvestDate", "Harvest / Picking Date")} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register("harvestDate")}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
            />
            {errors.harvestDate && (
              <p className="text-red-500 text-[11px] mt-1">
                {errors.harvestDate.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Farm Origin Location */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <MapPin className="h-4 w-4 text-emerald-700" />
          <h2 className="text-base font-bold text-slate-900">{t("farmerForm.locationSection", "Dispatch Location")}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                {t("farmerForm.district", "District")} <span className="text-red-500">*</span>
              </label>
              <VoiceInputButton onTranscript={(txt) => setValue("district", txt, { shouldValidate: true })} size="sm" />
            </div>
            <input
              type="text"
              placeholder={t("farmerForm.districtPlaceholder", "e.g. Cuttack / Sambalpur")}
              {...register("district")}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
            />
            {errors.district && (
              <p className="text-red-500 text-[11px] mt-1">{errors.district.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                {t("farmerForm.state", "State")} <span className="text-red-500">*</span>
              </label>
              <VoiceInputButton onTranscript={(txt) => setValue("state", txt, { shouldValidate: true })} size="sm" />
            </div>
            <input
              type="text"
              placeholder="e.g. Odisha"
              {...register("state")}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 text-xs"
            />
            {errors.state && (
              <p className="text-red-500 text-[11px] mt-1">{errors.state.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button asChild variant="outline" size="sm">
          <Link href="/farmer/products" className="flex items-center gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t("common.cancel", "Cancel")}</span>
          </Link>
        </Button>

        <Button type="submit" size="sm" disabled={isSubmitting} className="min-w-[160px]">
          <Save className="h-3.5 w-3.5 mr-1.5" />
          <span>{isSubmitting ? t("farmerForm.saving", "Saving Produce...") : isEdit ? t("farmerForm.updateListing", "Update Listing") : t("farmerForm.submitListing", "Publish to Marketplace")}</span>
        </Button>
      </div>
    </form>
  );
}
