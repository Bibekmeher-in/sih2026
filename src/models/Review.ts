import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReviewDocument extends Document {
  product: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorName: string;
  rating: number; // Overall 1 to 5
  freshnessScore: number; // 1 to 5
  packagingScore: number; // 1 to 5
  comment: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author user reference is required"],
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1 star"],
      max: [5, "Rating cannot exceed 5 stars"],
      default: 5,
    },
    freshnessScore: {
      type: Number,
      min: [1, "Freshness score must be at least 1"],
      max: [5, "Freshness score cannot exceed 5"],
      default: 5,
    },
    packagingScore: {
      type: Number,
      min: [1, "Packaging score must be at least 1"],
      max: [5, "Packaging score cannot exceed 5"],
      default: 5,
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
    },
    verifiedPurchase: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ product: 1, createdAt: -1 });

export const Review: Model<IReviewDocument> =
  mongoose.models.Review ||
  mongoose.model<IReviewDocument>("Review", ReviewSchema);

export default Review;
