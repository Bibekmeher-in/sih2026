import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAggregationCenter {
  name: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  contactPerson: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
  coldStorageAvailable: boolean;
}

export interface IFPODocument extends Document {
  user: mongoose.Types.ObjectId;
  organizationName: string;
  registrationNumber: string;
  yearOfEstablishment: number;
  memberFarmerCount: number;
  cropSpecialization: string[];
  aggregationCenters: IAggregationCenter[];
  annualTurnoverLakhs?: number;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AggregationCenterSchema = new Schema<IAggregationCenter>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactPhone: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  coldStorageAvailable: { type: Boolean, default: false },
});

const FPOSchema = new Schema<IFPODocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
      index: true,
    },
    organizationName: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, "FPO Registration / CIN is required"],
      unique: true,
      trim: true,
      index: true,
    },
    yearOfEstablishment: {
      type: Number,
      default: 2020,
    },
    memberFarmerCount: {
      type: Number,
      required: [true, "Member farmer count is required"],
      min: [1, "FPO must have at least 1 member farmer"],
      default: 100,
    },
    cropSpecialization: {
      type: [String],
      default: ["Onion", "Tomato", "Grapes"],
    },
    aggregationCenters: {
      type: [AggregationCenterSchema],
      default: [],
    },
    annualTurnoverLakhs: {
      type: Number,
      default: 50,
    },
    bankDetails: {
      accountName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

export const FPO: Model<IFPODocument> =
  mongoose.models.FPO || mongoose.model<IFPODocument>("FPO", FPOSchema);

export default FPO;
