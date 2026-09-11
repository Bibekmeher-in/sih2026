import mongoose, { Schema, Document, Model } from "mongoose";

export type AggregationStatus =
  | "OPEN"
  | "TARGET_REACHED"
  | "RESERVED"
  | "SOLD"
  | "CANCELLED";

export interface IFarmerContribution {
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  farmerPhone?: string;
  quantity: number;
  expectedPrice: number;
  qualityGrade: string;
  harvestDate: Date;
  availableDate: Date;
  status: "COMMITTED" | "COLLECTED" | "SOLD" | "CANCELLED";
  contributedAt: Date;
}

export interface IProduceAggregationDocument extends Document {
  groupId: mongoose.Types.ObjectId;
  fpoId?: mongoose.Types.ObjectId;
  productName: string;
  category: string;
  unit: string;
  targetQuantity: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  targetPrice?: number;
  status: AggregationStatus;
  matchedBuyerRequirementId?: mongoose.Types.ObjectId;
  matchedOrderId?: mongoose.Types.ObjectId;
  contributions: IFarmerContribution[];
  createdAt: Date;
  updatedAt: Date;
}

const FarmerContributionSchema = new Schema<IFarmerContribution>(
  {
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farmerName: { type: String, required: true },
    farmerPhone: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    expectedPrice: { type: Number, required: true, min: 1 },
    qualityGrade: { type: String, default: "Grade A" },
    harvestDate: { type: Date, default: Date.now },
    availableDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["COMMITTED", "COLLECTED", "SOLD", "CANCELLED"],
      default: "COMMITTED",
    },
    contributedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ProduceAggregationSchema = new Schema<IProduceAggregationDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "FarmerGroup",
      required: [true, "Group reference is required"],
      index: true,
    },
    fpoId: {
      type: Schema.Types.ObjectId,
      ref: "FPO",
      index: true,
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      default: "Fresh Vegetables",
      trim: true,
    },
    unit: {
      type: String,
      default: "kg",
    },
    targetQuantity: {
      type: Number,
      required: true,
      min: 1,
      default: 500,
    },
    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    targetPrice: {
      type: Number,
      default: 25,
    },
    status: {
      type: String,
      enum: ["OPEN", "TARGET_REACHED", "RESERVED", "SOLD", "CANCELLED"],
      default: "OPEN",
      index: true,
    },
    matchedBuyerRequirementId: {
      type: Schema.Types.ObjectId,
      ref: "BulkRequirement",
      default: null,
    },
    matchedOrderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    contributions: {
      type: [FarmerContributionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

ProduceAggregationSchema.index({ groupId: 1, status: 1 });
ProduceAggregationSchema.index({ productName: 1, status: 1 });

export const ProduceAggregation: Model<IProduceAggregationDocument> =
  mongoose.models.ProduceAggregation ||
  mongoose.model<IProduceAggregationDocument>(
    "ProduceAggregation",
    ProduceAggregationSchema
  );

export default ProduceAggregation;
