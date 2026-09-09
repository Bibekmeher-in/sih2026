import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDemandForecastDocument extends Document {
  product: mongoose.Types.ObjectId;
  productName: string;
  category: mongoose.Types.ObjectId;
  location: {
    district: string;
    state: string;
  };
  forecastPeriod: string; // e.g. "2026-W37", "Next 7 Days", "October 2026"
  startDate: Date;
  endDate: Date;
  predictedDemandKg: number;
  confidenceScore: number; // 0.0 to 1.0
  trendDirection: "RISING" | "STABLE" | "FALLING";
  factors: {
    seasonalImpact?: string;
    festivalSurge?: boolean;
    weatherCondition?: string;
    historicalAverageKg?: number;
  };
  aiModelVersion: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DemandForecastSchema = new Schema<IDemandForecastDocument>(
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
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    location: {
      district: { type: String, required: true, index: true },
      state: { type: String, required: true, index: true },
    },
    forecastPeriod: {
      type: String,
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    predictedDemandKg: {
      type: Number,
      required: true,
      min: [0, "Predicted demand cannot be negative"],
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: [0, "Confidence score must be between 0 and 1"],
      max: [1, "Confidence score must be between 0 and 1"],
      default: 0.85,
    },
    trendDirection: {
      type: String,
      enum: ["RISING", "STABLE", "FALLING"],
      default: "STABLE",
    },
    factors: {
      seasonalImpact: { type: String, default: "Peak Kharif harvest incoming" },
      festivalSurge: { type: Boolean, default: false },
      weatherCondition: { type: String, default: "Normal seasonal rainfall" },
      historicalAverageKg: { type: Number, default: 5000 },
    },
    aiModelVersion: {
      type: String,
      default: "Gemini-1.5-Pro-Agritech",
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

DemandForecastSchema.index({ product: 1, forecastPeriod: 1 });

export const DemandForecast: Model<IDemandForecastDocument> =
  mongoose.models.DemandForecast ||
  mongoose.model<IDemandForecastDocument>("DemandForecast", DemandForecastSchema);

export default DemandForecast;
