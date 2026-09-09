import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPriceRecommendationDocument extends Document {
  product: mongoose.Types.ObjectId;
  productName: string;
  location: {
    district: string;
    state: string;
  };
  currentFarmerPrice: number;
  apmcModalBenchmarkPrice: number;
  recommendedMinPrice: number;
  recommendedMaxPrice: number;
  factors: {
    apmcModalPrice: number;
    distanceToHubKm?: number;
    gradeMultiplier?: number;
    supplyDeficitPercent?: number;
    historicalWeeklyVolatilityPercent?: number;
  };
  explanation: string;
  aiModel: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PriceRecommendationSchema = new Schema<IPriceRecommendationDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      district: { type: String, required: true, index: true },
      state: { type: String, required: true, index: true },
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
    factors: {
      apmcModalPrice: { type: Number, required: true },
      distanceToHubKm: { type: Number, default: 45 },
      gradeMultiplier: { type: Number, default: 1.15 },
      supplyDeficitPercent: { type: Number, default: 10 },
      historicalWeeklyVolatilityPercent: { type: Number, default: 5 },
    },
    explanation: {
      type: String,
      required: [true, "AI explanation rationale is required"],
    },
    aiModel: {
      type: String,
      default: "Google Gemini 1.5 Pro",
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

export const PriceRecommendation: Model<IPriceRecommendationDocument> =
  mongoose.models.PriceRecommendation ||
  mongoose.model<IPriceRecommendationDocument>(
    "PriceRecommendation",
    PriceRecommendationSchema
  );

export default PriceRecommendation;
