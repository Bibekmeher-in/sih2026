import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMarketPriceDocument extends Document {
  productId?: mongoose.Types.ObjectId;
  productName: string;
  commodity?: string;
  variety?: string;
  category: string;
  marketName: string;
  district: string;
  state: string;
  minPrice: number;
  modalPrice: number;
  maxPrice: number;
  arrivalQuantity?: number;
  unit: string;
  date: Date;
  source: string;
  isLiveFeed?: boolean;
  dataGovInRecordId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketPriceSchema = new Schema<IMarketPriceDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: false,
      index: true,
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    commodity: {
      type: String,
      trim: true,
      index: true,
    },
    variety: {
      type: String,
      trim: true,
      index: true,
    },
    arrivalQuantity: {
      type: Number,
      default: 0,
    },
    isLiveFeed: {
      type: Boolean,
      default: false,
    },
    dataGovInRecordId: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: "Vegetables",
      trim: true,
      index: true,
    },
    marketName: {
      type: String,
      required: [true, "Market name is required"],
      trim: true,
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      index: true,
    },
    minPrice: {
      type: Number,
      required: true,
      min: [1, "Min price must be at least ₹1"],
    },
    modalPrice: {
      type: Number,
      required: true,
      min: [1, "Modal price must be at least ₹1"],
    },
    maxPrice: {
      type: Number,
      required: true,
      min: [1, "Max price must be at least ₹1"],
    },
    unit: {
      type: String,
      default: "kg",
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      default: "Market Benchmark",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

MarketPriceSchema.index({ productName: 1, district: 1, state: 1, date: -1 });

export const MarketPrice: Model<IMarketPriceDocument> =
  mongoose.models.MarketPrice ||
  mongoose.model<IMarketPriceDocument>("MarketPrice", MarketPriceSchema);

export default MarketPrice;
