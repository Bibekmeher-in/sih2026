"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tag,
  Sparkles,
  TrendingUp,
  Truck,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Users,
  ShieldCheck,
  Layers,
  Clock,
  ExternalLink,
  ChevronDown,
  Info,
  Calendar,
  MapPin,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CalculationStep {
  stepName: string;
  factor: string;
  adjustment: string;
  resultingRate: number;
}

interface PriceRecommendationData {
  _id?: string;
  productName: string;
  variety?: string;
  quantity: number;
  qualityGrade: string;
  location: {
    district: string;
    state: string;
  };
  market?: string;
  marketDataTimestamp?: string;
  currentFarmerPrice: number;
  apmcModalBenchmarkPrice: number;
  marketMin?: number;
  marketModal?: number;
  marketMax?: number;
  marketplaceAverage?: number;
  demandLevel?: "HIGH" | "MODERATE" | "LOW";
  demandScore?: number;
  supplyLevel?: "HIGH" | "MODERATE" | "LOW";
  supplyScore?: number;
  logisticsCost?: number;
  recommendedMinPrice: number;
  recommendedMaxPrice: number;
  targetPrice?: number;
  confidenceScore?: number;
  dataConfidence?: string;
  isAiGenerated?: boolean;
  aiModel?: string;
  source?: string;
  explanation: string;
  geminiExplanation?: string;
  aiSummary?: string;
  aiSuggestion?: string;
  risks?: string[];
  calculationSteps?: CalculationStep[];
  factors?: {
    apmcModalPrice: number;
    distanceToHubKm?: number;
    gradeMultiplier?: number;
    supplyDeficitPercent?: number;
    demandFactorText?: string;
    qualityFactorText?: string;
    logisticsFactorText?: string;
    supplyFactorText?: string;
  };
  netRealization?: {
    gross: number;
    logistics: number;
    platformFee: number;
    net: number;
  };
  traditionalComparison?: {
    traditionalRatePerKg: number;
    traditionalNet: number;
    kisanDirectAdvantagePerKg: number;
    kisanDirectTotalAdvantage: number;
  };
  createdAt?: string;
}

interface HistoryPoint {
  date: string;
  dayLabel: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  marketName: string;
}

interface FarmerProductOption {
  _id: string;
  name: string;
  variety?: string;
  category?: string;
  price: number;
  mandiBenchmarkPrice?: number;
  availableQuantity: number;
  unit: string;
  qualityGrade: string;
  location?: { district: string; state: string };
  harvestDate?: string;
}

const COMMON_CROPS = [
  "Tomato",
  "Potato",
  "Onion",
  "Cauliflower",
  "Pointed Gourd",
  "Paddy (Swarna)",
  "Turmeric (Dry)",
  "Cabbage",
  "Brinjal",
];

const REGIONAL_MANDIS = [
  { name: "Hinjilicut Regulated Mandi Yard", district: "Ganjam" },
  { name: "Berhampur APMC Yard", district: "Ganjam" },
  { name: "Cuttack Malgodown Wholesale Yard", district: "Cuttack" },
  { name: "Balasore Daily Wholesale Yard", district: "Balasore" },
  { name: "Nimapada Daily Haat", district: "Puri" },
  { name: "Bhubaneswar Unit-1 Haat", district: "Khordha" },
  { name: "Attabira Regulated Market Yard", district: "Bargarh" },
  { name: "Sambalpur Khetrajpur Yard", district: "Sambalpur" },
  { name: "Raikia Spice Mandi", district: "Kandhamal" },
  { name: "Angul Krishak Mandi", district: "Angul" },
];

export default function FarmerPricingPage() {
  // Input Form State
  const [selectedCrop, setSelectedCrop] = useState<string>("Tomato");
  const [customCropName, setCustomCropName] = useState<string>("");
  const [variety, setVariety] = useState<string>("Hybrid Red Table");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(500);
  const [qualityGrade, setQualityGrade] = useState<"Grade A" | "Grade B" | "Grade C" | "Premium Organic">("Grade A");
  const [district, setDistrict] = useState<string>("Ganjam");
  const [state, setState] = useState<string>("Odisha");
  const [targetMarket, setTargetMarket] = useState<string>("Hinjilicut Regulated Mandi Yard");
  const [transitDistanceKm, setTransitDistanceKm] = useState<number>(45);
  const [harvestDate, setHarvestDate] = useState<string>("");
  const [askingPrice, setAskingPrice] = useState<number>(24);

  // Farmer's listed products
  const [farmerProducts, setFarmerProducts] = useState<FarmerProductOption[]>([]);

  // Analysis State
  const [recommendation, setRecommendation] = useState<PriceRecommendationData | null>(null);
  const [calculationSteps, setCalculationSteps] = useState<CalculationStep[]>([]);
  const [historyTrend, setHistoryTrend] = useState<HistoryPoint[]>([]);
  const [insufficientHistory, setInsufficientHistory] = useState<boolean>(false);
  const [recentRecommendations, setRecentRecommendations] = useState<PriceRecommendationData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>("idle"); // "idle" | "fetching" | "analyzing"
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExplainDetails, setShowExplainDetails] = useState<boolean>(true);

  // Load farmer's active products & recent recommendations on mount
  useEffect(() => {
    setHarvestDate(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]); // default tomorrow
    async function loadInitialData() {
      try {
        // 1. Fetch farmer's own products
        const prodRes = await fetch("/api/farmer/price-recommendation/products");
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          if (prodJson.success && Array.isArray(prodJson.products)) {
            setFarmerProducts(prodJson.products);
            if (prodJson.products.length > 0) {
              const firstProd = prodJson.products[0];
              setSelectedProductId(firstProd._id);
              setSelectedCrop(firstProd.name);
              if (firstProd.variety) setVariety(firstProd.variety);
              setAskingPrice(firstProd.price || 24);
              setQuantity(firstProd.availableQuantity || 500);
              if (firstProd.qualityGrade) {
                setQualityGrade(firstProd.qualityGrade as "Grade A" | "Grade B" | "Grade C" | "Premium Organic");
              }
              if (firstProd.location?.district) {
                setDistrict(firstProd.location.district);
                const matchingMandi = REGIONAL_MANDIS.find(
                  (m) => m.district.toLowerCase() === firstProd.location?.district.toLowerCase()
                );
                if (matchingMandi) setTargetMarket(matchingMandi.name);
              }
              if (firstProd.location?.state) {
                setState(firstProd.location.state);
              }
            }
          }
        }

        // 2. Fetch recent recommendations history
        const recRes = await fetch("/api/farmer/price-recommendation");
        if (recRes.ok) {
          const recJson = await recRes.json();
          if (recJson.success && Array.isArray(recJson.recommendations)) {
            setRecentRecommendations(recJson.recommendations);
            if (recJson.recommendations.length > 0) {
              const latest = recJson.recommendations[0];
              setRecommendation(latest);
              if (latest.calculationSteps) {
                setCalculationSteps(latest.calculationSteps);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error loading initial pricing data:", err);
      }
    }

    loadInitialData();
  }, []);

  // Handle produce selection changes
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    if (prodId === "custom") {
      return;
    }
    const found = farmerProducts.find((p) => p._id === prodId);
    if (found) {
      setSelectedCrop(found.name);
      if (found.variety) setVariety(found.variety);
      setAskingPrice(found.price || 24);
      setQuantity(found.availableQuantity || 500);
      if (found.qualityGrade) {
        setQualityGrade(found.qualityGrade as "Grade A" | "Grade B" | "Grade C" | "Premium Organic");
      }
      if (found.location?.district) {
        setDistrict(found.location.district);
        const matchingMandi = REGIONAL_MANDIS.find(
          (m) => m.district.toLowerCase() === found.location?.district.toLowerCase()
        );
        if (matchingMandi) setTargetMarket(matchingMandi.name);
      }
      if (found.location?.state) {
        setState(found.location.state);
      }
    }
  };

  // Submit on-demand price analysis
  const handleAnalyzePrice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Immediately CLEAR previous recommendation so user never sees stale results
    setRecommendation(null);
    setCalculationSteps([]);
    setHistoryTrend([]);
    setIsAnalyzing(true);
    setLoadingStage("fetching");
    setErrorMessage(null);

    const cropNameToSubmit =
      selectedProductId === "custom" && customCropName.trim()
        ? customCropName.trim()
        : selectedCrop;

    // Transition to analyzing phase after 800ms to reflect sequential pipeline
    const stageTimer = setTimeout(() => {
      setLoadingStage("analyzing");
    }, 800);

    try {
      const payload = {
        productId: selectedProductId !== "custom" && selectedProductId ? selectedProductId : undefined,
        cropName: cropNameToSubmit,
        variety: variety.trim(),
        quantity: Number(quantity) || 500,
        qualityGrade,
        district: district.trim() || "Ganjam",
        state: state.trim() || "Odisha",
        targetMarket: targetMarket.trim(),
        transitDistanceKm: Number(transitDistanceKm) || 45,
        harvestDate,
        farmerAskingPrice: Number(askingPrice) || undefined,
        forceRefresh: true,
      };

      const res = await fetch("/api/farmer/price-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      clearTimeout(stageTimer);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to analyze price recommendation");
      }

      setRecommendation(json.recommendation);
      if (Array.isArray(json.calculationSteps)) {
        setCalculationSteps(json.calculationSteps);
      }
      if (Array.isArray(json.historyTrend)) {
        setHistoryTrend(json.historyTrend);
      }
      setInsufficientHistory(Boolean(json.insufficientHistory));

      // Update recent history list
      setRecentRecommendations((prev) => {
        const filtered = prev.filter((r) => r._id !== json.recommendation._id);
        return [json.recommendation, ...filtered].slice(0, 8);
      });
    } catch (err: unknown) {
      console.error("Price analysis error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to load market price recommendation. Please check your connection."
      );
    } finally {
      setIsAnalyzing(false);
      setLoadingStage("idle");
    }
  };

  // Load a historical recommendation from the drawer
  const handleLoadRecent = (item: PriceRecommendationData) => {
    setRecommendation(item);
    if (item.calculationSteps) setCalculationSteps(item.calculationSteps);
    setSelectedCrop(item.productName);
    if (item.variety) setVariety(item.variety);
    setQuantity(item.quantity || 500);
    if (item.qualityGrade) {
      setQualityGrade(item.qualityGrade as "Grade A" | "Grade B" | "Grade C" | "Premium Organic");
    }
    if (item.location?.district) setDistrict(item.location.district);
    if (item.location?.state) setState(item.location.state);
    if (item.market) setTargetMarket(item.market);
    if (item.currentFarmerPrice) setAskingPrice(item.currentFarmerPrice);
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  // Format currency helper
  const fmtInr = (val: number | undefined) =>
    val !== undefined ? `₹${val.toLocaleString("en-IN")}` : "₹0";

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              AI Price Recommendation Advisor
            </h1>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-0.5 text-xs shadow-2xs"
            >
              Deterministic Mandi Benchmark Engine
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Real-time farm-gate price corridors grounded in verified APMC spot rates, grade sorting, freshness, volume tiers, and freight logistics
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAnalyzePrice()}
            disabled={isAnalyzing}
            className="text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
            id="refresh-pricing-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isAnalyzing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Re-analyze</span>
          </Button>
          <Link href="/fpo?tab=opportunities">
            <Button
              size="sm"
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              <span>Bulk Buyers</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-red-700 mt-0.5">
              Deterministic calculations remain active. Please verify your connection or try again.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] h-7 border-red-300 text-red-800 hover:bg-red-100"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* 2. Interactive Product Analysis Input Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-800">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Analysis Inputs
              </h2>
              <p className="text-xs text-slate-500">
                Change any parameter below to immediately recalculate the farm-gate selling corridor
              </p>
            </div>
          </div>

          <Badge variant="outline" className="text-[11px] bg-slate-50 text-slate-600 border-slate-300">
            Multi-Factor Dynamic Engine
          </Badge>
        </div>

        <form onSubmit={handleAnalyzePrice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Produce Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Produce Listing / Crop
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                id="produce-select"
              >
                {farmerProducts.length > 0 && (
                  <optgroup label="My Active Listings">
                    {farmerProducts.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.qualityGrade}) - ₹{p.price}/{p.unit}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Standard Agri Benchmarks">
                  {COMMON_CROPS.map((crop) => (
                    <option key={crop} value={`crop_${crop}`}>
                      {crop} (Mandi Benchmark)
                    </option>
                  ))}
                </optgroup>
                <option value="custom">✏️ Enter Custom Produce...</option>
              </select>
            </div>

            {/* Custom Crop Name (conditional) */}
            {selectedProductId === "custom" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Custom Crop Name
                </label>
                <input
                  type="text"
                  value={customCropName}
                  onChange={(e) => setCustomCropName(e.target.value)}
                  placeholder="e.g. Tomato, Pointed Gourd"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>
            )}

            {/* Variety */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Variety
              </label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. Hybrid Red Table, Jyoti, Desi"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                id="variety-input"
              />
            </div>

            {/* Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Quantity (kg)</label>
                <div className="flex gap-1">
                  {[50, 250, 500, 1000].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setQuantity(preset)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        quantity === preset
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                max="100000"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                id="quantity-input"
                required
              />
            </div>

            {/* Quality Grade (including Grade C) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quality Grade
              </label>
              <select
                value={qualityGrade}
                onChange={(e) =>
                  setQualityGrade(e.target.value as "Grade A" | "Grade B" | "Grade C" | "Premium Organic")
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                id="grade-select"
              >
                <option value="Grade A">Grade A (Uniform Size, Zero Blemish) [+12%]</option>
                <option value="Grade B">Grade B (Standard Commercial Grade) [0% Baseline]</option>
                <option value="Grade C">Grade C (Non-uniform, Processing / Cull) [-15%]</option>
                <option value="Premium Organic">Premium Organic (Certified Chemical-Free) [+22%]</option>
              </select>
            </div>

            {/* Location District & State */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                District, State
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    const matchingMandi = REGIONAL_MANDIS.find(
                      (m) => m.district.toLowerCase() === e.target.value.toLowerCase()
                    );
                    if (matchingMandi) setTargetMarket(matchingMandi.name);
                  }}
                  placeholder="District"
                  className="w-1/2 rounded-xl border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                  id="district-input"
                  required
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="w-1/2 rounded-xl border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                  id="state-input"
                  required
                />
              </div>
            </div>

            {/* Target / Nearest Mandi Market */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target / Nearest APMC Mandi
              </label>
              <select
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                id="market-select"
              >
                {REGIONAL_MANDIS.map((mandi) => (
                  <option key={mandi.name} value={mandi.name}>
                    {mandi.name} ({mandi.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Harvest Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Harvest Date (Freshness Factor)
              </label>
              <input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                id="harvest-date-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Transit Distance */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Transit Distance</label>
                <span className="text-[11px] font-mono text-emerald-800 font-bold">
                  {transitDistanceKm} km
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                step="5"
                value={transitDistanceKm}
                onChange={(e) => setTransitDistanceKm(Number(e.target.value))}
                className="w-full accent-emerald-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                id="transit-slider"
              />
            </div>

            {/* Asking Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Desired Asking Price (₹/kg)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={askingPrice}
                onChange={(e) => setAskingPrice(Number(e.target.value))}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-none"
                id="asking-price-input"
              />
            </div>

            {/* Analyze Action Button */}
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                id="analyze-price-btn"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>
                      {loadingStage === "fetching"
                        ? "Fetching latest market data..."
                        : "Analyzing market conditions..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-300" />
                    <span>Analyze Price</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Main Body: Analysis Results OR Guidance State */}
      {!recommendation && !isAnalyzing ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
            <Tag className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Enter your produce details to get an AI-assisted price recommendation.
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Our deterministic pricing engine combines verified APMC Mandi benchmarks, active buyer RFQs, quality grading, and freight logistics with Google Gemini intelligence.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => handleAnalyzePrice()}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-emerald-300" />
              <span>Run Sample Analysis</span>
            </Button>
          </div>
        </div>
      ) : isAnalyzing ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-12 text-center space-y-4">
          <RefreshCw className="h-8 w-8 text-emerald-700 animate-spin mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-emerald-950">
              {loadingStage === "fetching"
                ? "Fetching latest market data..."
                : "Analyzing market conditions..."}
            </h3>
            <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
              {loadingStage === "fetching"
                ? "Accessing verified APMC Mandi benchmarks and regional buyer requirement lots..."
                : "Calculating volume adjustments, freshness urgency, and transit freight rates..."}
            </p>
          </div>
        </div>
      ) : recommendation ? (
        <div className="space-y-6">
          {/* Top Recommendations Highlight Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Recommended Selling Price Corridor */}
            <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50/80 to-white p-6 shadow-xs space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                  Recommended Selling Price
                </span>
                <Badge className="bg-emerald-800 text-white font-bold text-[10px] px-2 py-0.5">
                  Farm-Gate Fair Corridor
                </Badge>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono">
                    ₹{recommendation.recommendedMinPrice} – ₹{recommendation.recommendedMaxPrice}
                  </span>
                  <span className="text-xs font-bold text-emerald-800">/ kg</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-600 font-medium">Suggested Target:</span>
                  <span className="text-sm font-extrabold text-emerald-900 font-mono bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                    ₹{recommendation.targetPrice} / kg
                  </span>
                </div>
              </div>

              {/* Data Confidence Indicator */}
              <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span className="font-semibold">Data Confidence:</span>
                </div>
                <div className="flex items-center gap-2">
                  {recommendation.dataConfidence === "Limited data" ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[10px]">
                      Limited data
                    </Badge>
                  ) : (
                    <>
                      <div className="w-20 bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-700 h-full rounded-full"
                          style={{ width: `${recommendation.confidenceScore || 75}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-emerald-900 text-xs">
                        {recommendation.dataConfidence || `${recommendation.confidenceScore}%`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Real Market Benchmark Provenance & Rates */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Government APMC Benchmark
                </span>
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 font-medium">
                  {recommendation.market || "APMC Yard"}
                </Badge>
              </div>

              {/* Verified Provenance Badge */}
              <div className="text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {recommendation.productName} {recommendation.variety ? `(${recommendation.variety})` : ""}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {recommendation.marketDataTimestamp
                      ? new Date(recommendation.marketDataTimestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Latest Mandi Record"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Source: {recommendation.source || "Data.gov.in / Agmarknet Mandi Archive"}
                </div>
                <div className="pt-0.5">
                  <span className="text-[10px] text-amber-800 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Live market data unavailable — verified stored archive
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Min</span>
                  <span className="text-sm font-extrabold font-mono text-slate-700 mt-0.5 block">
                    ₹{recommendation.marketMin}/kg
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold block">Modal Benchmark</span>
                  <span className="text-sm font-extrabold font-mono text-amber-950 mt-0.5 block">
                    ₹{recommendation.marketModal}/kg
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Max</span>
                  <span className="text-sm font-extrabold font-mono text-slate-700 mt-0.5 block">
                    ₹{recommendation.marketMax}/kg
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500">Marketplace Average:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{recommendation.marketplaceAverage}/kg
                </span>
              </div>
            </div>

            {/* Card 3: Estimated Farmer Net Realization */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Estimated Realization
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Lot: {recommendation.quantity || 500} kg
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Gross Sales Value:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {fmtInr(recommendation.netRealization?.gross)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimated Logistics:</span>
                  <span className="font-mono font-bold text-rose-700">
                    -{fmtInr(recommendation.netRealization?.logistics)} (₹{recommendation.logisticsCost}/kg)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Platform Commission:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ₹0 (0% Direct)
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-950">Estimated Net Realization:</span>
                <span className="text-lg font-black font-mono text-emerald-900">
                  {fmtInr(recommendation.netRealization?.net)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Why This Price? (Gemini Explanation Factor Drivers) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Why This Price?
                </h3>
                <p className="text-xs text-slate-500">
                  Multi-factor market drivers evaluated for this exact batch and region
                </p>
              </div>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-300">
                Transparent Factors
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Factor 1: Demand */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Demand</span>
                </div>
                <span className="text-sm font-extrabold text-emerald-800 block">
                  {recommendation.demandLevel || "Moderate"}
                </span>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {recommendation.factors?.demandFactorText || "Steady inquiries recorded"}
                </p>
              </div>

              {/* Factor 2: Supply */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Layers className="h-3.5 w-3.5 text-indigo-700" />
                  <span>Supply</span>
                </div>
                <span className="text-sm font-extrabold text-indigo-900 block">
                  {recommendation.supplyLevel || "Moderate"}
                </span>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {recommendation.factors?.supplyFactorText || "Normal regional arrivals"}
                </p>
              </div>

              {/* Factor 3: Quality */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Quality</span>
                </div>
                <span className="text-sm font-extrabold text-emerald-800 block">
                  {recommendation.qualityGrade || "Grade A"}
                </span>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {recommendation.factors?.qualityFactorText || "Uniform farm-gate sorting"}
                </p>
              </div>

              {/* Factor 4: Market Modal */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Tag className="h-3.5 w-3.5 text-amber-700" />
                  <span>Mandi Modal</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900 font-mono block">
                  ₹{recommendation.marketModal || recommendation.apmcModalBenchmarkPrice}/kg
                </span>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Nearest APMC modal rate
                </p>
              </div>

              {/* Factor 5: Logistics */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Truck className="h-3.5 w-3.5 text-slate-600" />
                  <span>Logistics</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900 font-mono block">
                  ₹{recommendation.logisticsCost}/kg
                </span>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {recommendation.factors?.logisticsFactorText || `Freight across ${transitDistanceKm} km`}
                </p>
              </div>
            </div>
          </div>

          {/* 5. Explain Calculation Section (User Explicit Request) */}
          {calculationSteps && calculationSteps.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Explain Calculation (Step-by-Step Derivation)
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExplainDetails(!showExplainDetails)}
                  className="text-xs text-slate-600 h-7"
                >
                  <span>{showExplainDetails ? "Collapse" : "Expand"}</span>
                  <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${showExplainDetails ? "rotate-180" : ""}`} />
                </Button>
              </div>

              {showExplainDetails && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                        <th className="py-2.5 px-3">Step</th>
                        <th className="py-2.5 px-3">Calculation Factor</th>
                        <th className="py-2.5 px-3">Adjustment Applied</th>
                        <th className="py-2.5 px-3 text-right">Resulting Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {calculationSteps.map((step, idx) => (
                        <tr key={idx} className={idx === calculationSteps.length - 1 ? "bg-emerald-50/40 font-bold" : ""}>
                          <td className="py-2.5 px-3 text-slate-900">{step.stepName}</td>
                          <td className="py-2.5 px-3 text-slate-600">{step.factor}</td>
                          <td className="py-2.5 px-3 text-emerald-800 font-mono">{step.adjustment}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{step.resultingRate.toFixed(2)}/kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 6. AI Insight & Risks Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Insight Card */}
            <div className="lg:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                  <Sparkles className="h-4 w-4 text-amber-700" />
                  <span>AI Market Rationale &amp; Strategy</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-white/80 text-[10px] text-amber-900 border-amber-300 font-semibold"
                >
                  {recommendation.isAiGenerated ? "AI-generated insight" : "Deterministic Market Benchmark"}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-normal">
                {recommendation.aiSummary || recommendation.explanation}
              </p>

              {recommendation.aiSuggestion && (
                <div className="pt-2 border-t border-amber-200/60 text-xs text-amber-900">
                  <span className="font-bold">Recommendation: </span>
                  <span>{recommendation.aiSuggestion}</span>
                </div>
              )}

              <p className="text-[10px] text-amber-800/80 italic pt-1">
                Notice: AI explanations are strictly grounded in the calculated deterministic numbers and verified market signals.
              </p>
            </div>

            {/* Risks Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Market &amp; Transit Risks</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                {(recommendation.risks && recommendation.risks.length > 0
                  ? recommendation.risks
                  : [
                      "Spot rates may soften if district APMC harvest arrivals surge over 48h.",
                      "Ensure moisture checks prior to long-distance dispatch.",
                      "Confirm bulk buyer commitment and escrow before harvest release.",
                    ]
                ).map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 7. Authentic Historical Price Trend Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Historical Market Price History
                </h3>
                <p className="text-xs text-slate-500">
                  Recorded APMC Mandi modal benchmarks across past trading days
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                INR / kg
              </Badge>
            </div>

            {insufficientHistory || !historyTrend || historyTrend.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No sufficient historical market data available.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="dayLabel" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      formatter={(val: unknown) => (typeof val === "number" ? `₹${val}/kg` : String(val))}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Line
                      type="monotone"
                      dataKey="modalPrice"
                      name="Mandi Modal Rate"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minPrice"
                      name="Mandi Min Rate"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="maxPrice"
                      name="Mandi Max Rate"
                      stroke="#059669"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 8. Action Buttons Connected to Real Features */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Operational Actions for this Produce Lot
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Action 1: List at Recommended Price */}
              <Link
                href={`/farmer/products/new?name=${encodeURIComponent(recommendation.productName)}&variety=${encodeURIComponent(recommendation.variety || "")}&price=${recommendation.targetPrice || 25}&quantity=${recommendation.quantity || 500}&qualityGrade=${encodeURIComponent(recommendation.qualityGrade || "Grade A")}&district=${encodeURIComponent(recommendation.location?.district || "Ganjam")}&state=${encodeURIComponent(recommendation.location?.state || "Odisha")}&mandiBenchmarkPrice=${recommendation.apmcModalBenchmarkPrice || 20}`}
                className="w-full"
                id="action-list-produce"
              >
                <Button className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 mr-1" />
                  <span>List at Recommended Price (₹{recommendation.targetPrice}/kg)</span>
                </Button>
              </Link>

              {/* Action 2: View Bulk Buyers */}
              <Link href="/fpo?tab=opportunities" className="w-full" id="action-view-buyers">
                <Button
                  variant="outline"
                  className="w-full border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                  <span>View Matching Buyers</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </Button>
              </Link>

              {/* Action 3: Join Collective Sale */}
              <Link href="/fpo?tab=aggregation" className="w-full" id="action-join-collective">
                <Button
                  variant="outline"
                  className="w-full border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Users className="h-3.5 w-3.5 mr-1 text-indigo-700" />
                  <span>Join Collective Sale</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* 9. Recent Recommendations History */}
      {recentRecommendations.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Price Analyses
              </h3>
              <p className="text-xs text-slate-500">
                Click any previously analyzed crop lot to inspect its market benchmark and corridors
              </p>
            </div>
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600">
              {recentRecommendations.length} Stored
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentRecommendations.map((rec, i) => (
              <button
                key={rec._id || i}
                onClick={() => handleLoadRecent(rec)}
                className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/40 transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                    {rec.productName} {rec.variety ? `(${rec.variety})` : ""}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-white text-slate-600">
                    {rec.qualityGrade || "Grade A"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Recommended:</span>
                  <span className="font-mono font-extrabold text-emerald-800">
                    ₹{rec.recommendedMinPrice} - ₹{rec.recommendedMaxPrice}/kg
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>{rec.location?.district || "Ganjam"}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {rec.createdAt
                        ? new Date(rec.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Recent"}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
