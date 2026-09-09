import mongoose, { Schema, Document, Model } from "mongoose";

export type DeliveryStatusType =
  | "PENDING_ASSIGNMENT"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";

export interface IDeliveryDocument extends Document {
  deliveryTrackingNumber: string;
  order: mongoose.Types.ObjectId;
  pickupLocation: {
    name: string;
    address: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
    contactPhone: string;
  };
  destination: {
    name: string;
    address: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
    contactPhone: string;
  };
  vehicle?: mongoose.Types.ObjectId;
  driverName?: string;
  driverPhone?: string;
  route?: mongoose.Types.ObjectId;
  status: DeliveryStatusType;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: Date;
  };
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  temperatureCelsius?: number; // For cold-chain produce
  signatureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema<IDeliveryDocument>(
  {
    deliveryTrackingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order reference is required"],
      unique: true,
      index: true,
    },
    pickupLocation: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      contactPhone: { type: String, required: true },
    },
    destination: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      contactPhone: { type: String, required: true },
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      index: true,
    },
    driverName: {
      type: String,
      default: "",
    },
    driverPhone: {
      type: String,
      default: "",
    },
    route: {
      type: Schema.Types.ObjectId,
      ref: "Route",
    },
    status: {
      type: String,
      enum: [
        "PENDING_ASSIGNMENT",
        "ASSIGNED",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
      ],
      default: "PENDING_ASSIGNMENT",
      index: true,
    },
    estimatedDistanceKm: {
      type: Number,
      required: true,
      min: [0, "Distance cannot be negative"],
    },
    estimatedDurationMinutes: {
      type: Number,
      required: true,
      min: [0, "Duration cannot be negative"],
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      updatedAt: { type: Date, default: Date.now },
    },
    actualPickupTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    temperatureCelsius: {
      type: Number,
      default: 18,
    },
    signatureUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Delivery: Model<IDeliveryDocument> =
  mongoose.models.Delivery ||
  mongoose.model<IDeliveryDocument>("Delivery", DeliverySchema);

export default Delivery;
