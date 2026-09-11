import mongoose, { Schema, Document, Model } from "mongoose";

export type CommunityPostType =
  | "GENERAL"
  | "PRODUCT"
  | "MARKET_PRICE"
  | "DEMAND"
  | "FARMING_TIPS"
  | "PROBLEM"
  | "ANNOUNCEMENT"
  | "BULK_BUYING"
  | "BULK_SELLING";

export interface IMarketPriceDetails {
  crop: string;
  pricePerKg: number;
  marketName: string;
  location: string;
  reportedDate: string;
}

export interface ICommunityPostDocument extends Document {
  groupId?: mongoose.Types.ObjectId;
  fpoId?: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  title?: string;
  content: string;
  postType: CommunityPostType;
  productId?: mongoose.Types.ObjectId;
  productName?: string;
  marketPriceDetails?: IMarketPriceDetails;
  images?: string[];
  likes: string[]; // User IDs who liked
  commentCount: number;
  isPinned: boolean;
  isAnnouncement: boolean;
  status: "ACTIVE" | "REPORTED" | "DELETED";
  createdAt: Date;
  updatedAt: Date;
}

const MarketPriceDetailsSchema = new Schema<IMarketPriceDetails>(
  {
    crop: { type: String, required: true },
    pricePerKg: { type: Number, required: true, min: 1 },
    marketName: { type: String, required: true },
    location: { type: String, required: true },
    reportedDate: { type: String, required: true },
  },
  { _id: false }
);

const CommunityPostSchema = new Schema<ICommunityPostDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "FarmerGroup",
      index: true,
    },
    fpoId: {
      type: Schema.Types.ObjectId,
      ref: "FPO",
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author reference is required"],
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorRole: {
      type: String,
      default: "FARMER",
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
    },
    postType: {
      type: String,
      enum: [
        "GENERAL",
        "PRODUCT",
        "MARKET_PRICE",
        "DEMAND",
        "FARMING_TIPS",
        "PROBLEM",
        "ANNOUNCEMENT",
        "BULK_BUYING",
        "BULK_SELLING",
      ],
      default: "GENERAL",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },
    productName: {
      type: String,
      trim: true,
    },
    marketPriceDetails: {
      type: MarketPriceDetailsSchema,
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    likes: {
      type: [String],
      default: [],
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isAnnouncement: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "REPORTED", "DELETED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

CommunityPostSchema.index({ groupId: 1, createdAt: -1 });
CommunityPostSchema.index({ postType: 1, createdAt: -1 });

export const CommunityPost: Model<ICommunityPostDocument> =
  mongoose.models.CommunityPost ||
  mongoose.model<ICommunityPostDocument>("CommunityPost", CommunityPostSchema);

export default CommunityPost;
