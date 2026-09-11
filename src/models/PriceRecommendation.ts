import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPriceRecommendationDocument extends Document {
  product?: mongoose.Types.ObjectId;
  farmerId?: mongoose.Types.ObjectId;
  productName: string;
  variety?: string;
  quantity?: number;
  qualityGrade?: string;
  location: {
    district: string;
    state: string;
  };
  market?: string;
  marketDataTimestamp?: Date;
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
  dataConfidence?: string;
  harvestDate?: Date;
  calculationSteps?: Array<{
    stepName: string;
    factor: string;
    adjustment: string;
    resultingRate: number;
  }>;
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
  factors: {
    apmcModalPrice: number;
    distanceToHubKm?: number;
    gradeMultiplier?: number;
    supplyDeficitPercent?: number;
    historicalWeeklyVolatilityPercent?: number;
    demandFactorText?: string;
    qualityFactorText?: string;
    logisticsFactorText?: string;
    supplyFactorText?: string;
  };
  explanation: string;
  geminiExplanation?: string;
  aiSummary?: string;
  aiSuggestion?: string;
  risks?: string[];
  confidenceScore?: number;
  isAiGenerated?: boolean;
  aiModel: string;
  source?: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PriceRecommendationSchema = new Schema<IPriceRecommendationDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: false,
      index: true,
    },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    variety: {
      type: String,
      default: "",
      trim: true,
    },
    quantity: {
      type: Number,
      default: 500,
      min: 1,
    },
    qualityGrade: {
      type: String,
      default: "Grade A",
      trim: true,
    },
    location: {
      district: { type: String, required: true, index: true },
      state: { type: String, required: true, index: true },
    },
    market: {
      type: String,
      default: "",
      trim: true,
    },
    marketDataTimestamp: {
      type: Date,
    },
    harvestDate: {
      type: Date,
    },
    currentFarmerPrice: {
      type: Number,
      required: true,
      min: [1, "Price must be at least ₹1"],
    },
    apmcModalBenchmarkPrice: {
      type: Number,
      required: true,
      min: [1, "Benchmark price must be at least ₹1"],
    },
    marketMin: {
      type: Number,
      default: 0,
    },
    marketModal: {
      type: Number,
      default: 0,
    },
    marketMax: {
      type: Number,
      default: 0,
    },
    marketplaceAverage: {
      type: Number,
      default: 0,
    },
    demandLevel: {
      type: String,
      enum: ["HIGH", "MODERATE", "LOW"],
      default: "MODERATE",
    },
    demandScore: {
      type: Number,
      default: 75,
    },
    supplyLevel: {
      type: String,
      enum: ["HIGH", "MODERATE", "LOW"],
      default: "MODERATE",
    },
    supplyScore: {
      type: Number,
      default: 50,
    },
    logisticsCost: {
      type: Number,
      default: 1.5,
    },
    dataConfidence: {
      type: String,
      default: "High",
    },
    calculationSteps: [
      {
        stepName: { type: String, required: true },
        factor: { type: String, required: true },
        adjustment: { type: String, required: true },
        resultingRate: { type: Number, required: true },
      },
    ],
    recommendedMinPrice: {
      type: Number,
      required: true,
      min: [1, "Recommended min price must be at least ₹1"],
    },
    recommendedMaxPrice: {
      type: Number,
      required: true,
      min: [1, "Recommended max price must be at least ₹1"],
    },
    targetPrice: {
      type: Number,
      default: 0,
    },
    netRealization: {
      gross: { type: Number, default: 0 },
      logistics: { type: Number, default: 0 },
      platformFee: { type: Number, default: 0 },
      net: { type: Number, default: 0 },
    },
    traditionalComparison: {
      traditionalRatePerKg: { type: Number, default: 0 },
      traditionalNet: { type: Number, default: 0 },
      kisanDirectAdvantagePerKg: { type: Number, default: 0 },
      kisanDirectTotalAdvantage: { type: Number, default: 0 },
    },
    factors: {
      apmcModalPrice: { type: Number, required: true },
      distanceToHubKm: { type: Number, default: 45 },
      gradeMultiplier: { type: Number, default: 1.15 },
      supplyDeficitPercent: { type: Number, default: 10 },
      historicalWeeklyVolatilityPercent: { type: Number, default: 5 },
      demandFactorText: { type: String, default: "" },
      qualityFactorText: { type: String, default: "" },
      logisticsFactorText: { type: String, default: "" },
      supplyFactorText: { type: String, default: "" },
    },
    explanation: {
      type: String,
      required: [true, "AI explanation rationale is required"],
    },
    geminiExplanation: {
      type: String,
      default: "",
    },
    aiSummary: {
      type: String,
      default: "",
    },
    aiSuggestion: {
      type: String,
      default: "",
    },
    risks: {
      type: [String],
      default: [],
    },
    confidenceScore: {
      type: Number,
      default: 80,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    aiModel: {
      type: String,
      default: "Google Gemini 1.5 Pro",
    },
    source: {
      type: String,
      default: "Dynamic Mandi Benchmark",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PriceRecommendationSchema.index({ farmerId: 1, productName: 1, createdAt: -1 });

if (mongoose.models && mongoose.models.PriceRecommendation) {
  delete (mongoose.models as Record<string, unknown>).PriceRecommendation;
}

export const PriceRecommendation: Model<IPriceRecommendationDocument> =
  mongoose.models.PriceRecommendation ||
  mongoose.model<IPriceRecommendationDocument>(
    "PriceRecommendation",
    PriceRecommendationSchema
  );

export default PriceRecommendation;
