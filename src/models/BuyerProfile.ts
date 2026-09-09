import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeliveryHub {
  name: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface IBuyerProfileDocument extends Document {
  user: mongoose.Types.ObjectId;
  companyName: string;
  buyerType: "RETAILER" | "PROCESSOR" | "EXPORTER" | "HORECA" | "INSTITUTIONAL" | "CONSUMER";
  gstin?: string;
  fssaiNumber?: string;
  deliveryHubs: IDeliveryHub[];
  preferredPaymentTerms: "ADVANCE" | "NET_7" | "NET_15" | "ON_DELIVERY";
  monthlyProcurementVolumeTonnes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryHubSchema = new Schema<IDeliveryHub>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

const BuyerProfileSchema = new Schema<IBuyerProfileDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, "Company / Buyer name is required"],
      trim: true,
    },
    buyerType: {
      type: String,
      enum: ["RETAILER", "PROCESSOR", "EXPORTER", "HORECA", "INSTITUTIONAL", "CONSUMER"],
      default: "RETAILER",
      required: true,
    },
    gstin: {
      type: String,
      trim: true,
      default: "",
    },
    fssaiNumber: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryHubs: {
      type: [DeliveryHubSchema],
      default: [],
    },
    preferredPaymentTerms: {
      type: String,
      enum: ["ADVANCE", "NET_7", "NET_15", "ON_DELIVERY"],
      default: "ON_DELIVERY",
    },
    monthlyProcurementVolumeTonnes: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

export const BuyerProfile: Model<IBuyerProfileDocument> =
  mongoose.models.BuyerProfile ||
  mongoose.model<IBuyerProfileDocument>("BuyerProfile", BuyerProfileSchema);

export default BuyerProfile;
