import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMatchedSupplierInfo {
  sellerId: string;
  sellerName: string;
  sellerType: "Farmer" | "FPO";
  location: string;
  distanceKm: number;
  availableQuantity: number;
  unit: string;
  offeredPrice: number;
  qualityGrade: string;
  matchScore: number; // 0 to 100
  phone?: string;
}

export interface IBulkRequirementDocument extends Document {
  buyer: mongoose.Types.ObjectId;
  buyerName: string;
  buyerPhone: string;
  productName: string;
  category: string;
  requiredQuantity: number;
  unit: "kg" | "quintal" | "ton";
  targetPrice: number; // in INR per unit
  requiredDate: Date;
  deliveryLocation: {
    district: string;
    state: string;
    pincode: string;
    deliveryHubName?: string;
  };
  qualityPreference?: string;
  notes?: string;
  status: "OPEN" | "MATCHED" | "FULFILLED" | "CANCELLED";
  matchedSuppliers: IMatchedSupplierInfo[];
  createdAt: Date;
  updatedAt: Date;
}

const MatchedSupplierSchema = new Schema<IMatchedSupplierInfo>(
  {
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
    sellerType: { type: String, enum: ["Farmer", "FPO"], required: true },
    location: { type: String, required: true },
    distanceKm: { type: Number, required: true, default: 0 },
    availableQuantity: { type: Number, required: true },
    unit: { type: String, required: true, default: "kg" },
    offeredPrice: { type: Number, required: true },
    qualityGrade: { type: String, default: "Grade A" },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    phone: { type: String },
  },
  { _id: false }
);

const BulkRequirementSchema = new Schema<IBulkRequirementDocument>(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    buyerName: {
      type: String,
      required: true,
    },
    buyerPhone: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      default: "Vegetables",
    },
    requiredQuantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    unit: {
      type: String,
      enum: ["kg", "quintal", "ton"],
      default: "quintal",
      required: true,
    },
    targetPrice: {
      type: Number,
      required: true,
      min: [0, "Target price cannot be negative"],
    },
    requiredDate: {
      type: Date,
      required: true,
    },
    deliveryLocation: {
      district: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      deliveryHubName: { type: String },
    },
    qualityPreference: {
      type: String,
      default: "Grade A",
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ["OPEN", "MATCHED", "FULFILLED", "CANCELLED"],
      default: "OPEN",
      index: true,
    },
    matchedSuppliers: [MatchedSupplierSchema],
  },
  {
    timestamps: true,
  }
);

export const BulkRequirement: Model<IBulkRequirementDocument> =
  mongoose.models.BulkRequirement ||
  mongoose.model<IBulkRequirementDocument>("BulkRequirement", BulkRequirementSchema);
