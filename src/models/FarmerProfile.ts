import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFarmerProfileDocument extends Document {
  user: mongoose.Types.ObjectId;
  farmName: string;
  landAreaAcres: number;
  irrigationType: string;
  primaryCrops: string[];
  soilType?: string;
  kisanCreditCardNumber?: string;
  aadhaarVerified: boolean;
  fpoMember?: mongoose.Types.ObjectId;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FarmerProfileSchema = new Schema<IFarmerProfileDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
      index: true,
    },
    farmName: {
      type: String,
      default: "Organic Green Farm",
      trim: true,
    },
    landAreaAcres: {
      type: Number,
      required: [true, "Land area in acres is required"],
      min: [0.1, "Land area must be at least 0.1 acres"],
    },
    irrigationType: {
      type: String,
      default: "Drip Irrigation",
      enum: ["Drip Irrigation", "Canal", "Rainfed", "Borewell", "Sprinkler"],
    },
    primaryCrops: {
      type: [String],
      default: ["Tomato", "Onion"],
    },
    soilType: {
      type: String,
      default: "Black Soil / Alluvial",
    },
    kisanCreditCardNumber: {
      type: String,
      default: "",
    },
    aadhaarVerified: {
      type: Boolean,
      default: true,
    },
    fpoMember: {
      type: Schema.Types.ObjectId,
      ref: "FPO",
    },
    bankDetails: {
      accountName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
    },
    coordinates: {
      latitude: { type: Number, default: 19.9975 }, // Default Maharashtra region
      longitude: { type: Number, default: 73.7898 },
    },
  },
  {
    timestamps: true,
  }
);

export const FarmerProfile: Model<IFarmerProfileDocument> =
  mongoose.models.FarmerProfile ||
  mongoose.model<IFarmerProfileDocument>("FarmerProfile", FarmerProfileSchema);

export default FarmerProfile;
