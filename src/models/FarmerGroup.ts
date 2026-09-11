import mongoose, { Schema, Document, Model } from "mongoose";

export type GroupPrivacy = "PUBLIC" | "PRIVATE" | "FPO_ONLY";

export interface IFarmerGroupDocument extends Document {
  name: string;
  description: string;
  product: string; // Crop name, e.g. "Tomato", "Potato"
  category: string; // Category, e.g. "Fresh Vegetables"
  location: {
    village?: string;
    district: string;
    state: string;
  };
  privacy: GroupPrivacy;
  image?: string;
  creatorId: mongoose.Types.ObjectId;
  fpoId?: mongoose.Types.ObjectId;
  memberCount: number;
  postCount: number;
  aggregatedQuantityKg: number;
  rules?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FarmerGroupSchema = new Schema<IFarmerGroupDocument>(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Group description is required"],
      trim: true,
    },
    product: {
      type: String,
      required: [true, "Focus crop or produce name is required"],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      default: "Fresh Vegetables",
      trim: true,
    },
    location: {
      village: { type: String, default: "" },
      district: { type: String, required: true, index: true },
      state: { type: String, required: true, index: true },
    },
    privacy: {
      type: String,
      enum: ["PUBLIC", "PRIVATE", "FPO_ONLY"],
      default: "PUBLIC",
      required: true,
    },
    image: {
      type: String,
      default: "/crops/vegetables.png",
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fpoId: {
      type: Schema.Types.ObjectId,
      ref: "FPO",
      index: true,
    },
    memberCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    postCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    aggregatedQuantityKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    rules: {
      type: [String],
      default: [
        "Be respectful to all farmers and members.",
        "Share authentic farm-gate prices and truthful harvest information.",
        "Zero middleman speculation or spamming allowed.",
      ],
    },
  },
  {
    timestamps: true,
  }
);

FarmerGroupSchema.index({ fpoId: 1, product: 1 });
FarmerGroupSchema.index({ "location.state": 1, "location.district": 1 });
FarmerGroupSchema.index({ name: "text", description: "text", product: "text" });

export const FarmerGroup: Model<IFarmerGroupDocument> =
  mongoose.models.FarmerGroup ||
  mongoose.model<IFarmerGroupDocument>("FarmerGroup", FarmerGroupSchema);

export default FarmerGroup;
