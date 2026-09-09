import mongoose, { Schema, Document, Model } from "mongoose";
import { UnitType } from "@/types";

export type QualityGrade = "Grade A" | "Grade B" | "Premium Organic";
export type ProductStatus = "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "ARCHIVED" | "DISABLED";

export interface IProductDocument extends Document {
  seller: mongoose.Types.ObjectId;
  sellerType: "User" | "FarmerProfile" | "FPO";
  sellerName?: string;
  name: string;
  hindiName?: string;
  variety?: string;
  category: mongoose.Types.ObjectId;
  description: string;
  price: number; // Price per unit in INR
  mandiBenchmarkPrice?: number;
  unit: UnitType;
  availableQuantity: number;
  minimumOrderQuantity: number;
  qualityGrade: QualityGrade;
  harvestDate: Date;
  location: {
    district: string;
    state: string;
    pincode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  images: string[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      required: [true, "Seller reference is required"],
      refPath: "sellerType",
      index: true,
    },
    sellerType: {
      type: String,
      required: true,
      enum: ["User", "FarmerProfile", "FPO"],
      default: "User",
    },
    sellerName: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    hindiName: {
      type: String,
      default: "",
      trim: true,
    },
    variety: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category reference is required"],
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be at least ₹1"],
      index: true,
    },
    mandiBenchmarkPrice: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "quintal", "ton", "crate"],
      default: "kg",
      required: true,
    },
    availableQuantity: {
      type: Number,
      required: [true, "Available quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    minimumOrderQuantity: {
      type: Number,
      required: [true, "Minimum order quantity is required"],
      min: [1, "MOQ must be at least 1"],
      default: 1,
    },
    qualityGrade: {
      type: String,
      enum: ["Grade A", "Grade B", "Premium Organic"],
      default: "Grade A",
      required: true,
    },
    harvestDate: {
      type: Date,
      required: [true, "Harvest date is required"],
      default: Date.now,
    },
    location: {
      district: { type: String, required: true, index: true },
      state: { type: String, required: true, index: true },
      pincode: { type: String, default: "" },
      coordinates: {
        latitude: { type: Number, default: 19.9975 },
        longitude: { type: Number, default: 73.7898 },
      },
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK", "ARCHIVED", "DISABLED"],
      default: "AVAILABLE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching & filtering
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ "location.state": 1, "location.district": 1 });
ProductSchema.index({ name: "text", description: "text", variety: "text" });

export const Product: Model<IProductDocument> =
  mongoose.models.Product ||
  mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;
