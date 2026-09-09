import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Category: Model<ICategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<ICategoryDocument>("Category", CategorySchema);

export default Category;
