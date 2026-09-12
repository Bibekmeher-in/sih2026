import mongoose, { Schema, Document, Model } from "mongoose";
import {
  DeliveryAssignmentStatus,
  AssignmentMethod,
} from "@/types";

export type DeliveryStatusType =
  | "PENDING_ASSIGNMENT"
  | "ASSIGNED"
  | "ACCEPTED"
  | "ARRIVED_AT_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "ARRIVED_AT_DESTINATION"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "REJECTED"
  | "CANCELLED";

export interface IAssignmentHistoryItem {
  partner: mongoose.Types.ObjectId;
  partnerName?: string;
  assignedAt: Date;
  assignedBy?: mongoose.Types.ObjectId;
  assignmentMethod: AssignmentMethod;
  aiConfidence?: number;
  aiReason?: string;
  rankingScore?: number;
  distanceAtAssignmentKm?: number;
  status: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  unassignedAt?: Date;
  reassignmentReason?: string;
}

export interface IDeliveryStatusHistoryItem {
  status: DeliveryStatusType;
  changedBy?: mongoose.Types.ObjectId;
  changedByRole?: string;
  timestamp: Date;
  note?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

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
  assignedPartner?: mongoose.Types.ObjectId;
  assignmentStatus: DeliveryAssignmentStatus;
  assignmentHistory: IAssignmentHistoryItem[];
  vehicle?: mongoose.Types.ObjectId;
  driverName?: string;
  driverPhone?: string;
  route?: mongoose.Types.ObjectId;
  status: DeliveryStatusType;
  statusHistory: IDeliveryStatusHistoryItem[];
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    updatedAt: Date;
    locationGeo?: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  assignedAt?: Date;
  acceptedAt?: Date;
  arrivedPickupAt?: Date;
  actualPickupTime?: Date;
  pickedUpAt?: Date;
  inTransitAt?: Date;
  arrivedDestinationAt?: Date;
  actualDeliveryTime?: Date;
  deliveredAt?: Date;
  rejectedAt?: Date;
  failedAt?: Date;
  rejectionReason?: string;
  failureReason?: string;
  temperatureCelsius?: number; // For cold-chain produce
  signatureUrl?: string;
  otpCode?: string;
  isOtpVerified?: boolean;
  proofOfDelivery?: {
    otpEntered?: string;
    isOtpVerified?: boolean;
    verifiedAt?: Date;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentHistorySchema = new Schema<IAssignmentHistoryItem>(
  {
    partner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    partnerName: { type: String, default: "" },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    assignmentMethod: {
      type: String,
      enum: ["AI_AUTO", "ADMIN_MANUAL", "FALLBACK_AUTO"],
      default: "ADMIN_MANUAL",
    },
    aiConfidence: { type: Number },
    aiReason: { type: String, default: "" },
    rankingScore: { type: Number },
    distanceAtAssignmentKm: { type: Number },
    status: { type: String, default: "ASSIGNED" },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, default: "" },
    unassignedAt: { type: Date },
    reassignmentReason: { type: String, default: "" },
  },
  { _id: false }
);

const DeliveryStatusHistorySchema = new Schema<IDeliveryStatusHistoryItem>(
  {
    status: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    changedByRole: { type: String, default: "SYSTEM" },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  { _id: false }
);

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
    assignedPartner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    assignmentStatus: {
      type: String,
      enum: ["UNASSIGNED", "ASSIGNED", "ACCEPTED", "REJECTED", "CANCELLED"],
      default: "UNASSIGNED",
      index: true,
    },
    assignmentHistory: {
      type: [AssignmentHistorySchema],
      default: [],
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
        "ACCEPTED",
        "ARRIVED_AT_PICKUP",
        "PICKED_UP",
        "IN_TRANSIT",
        "ARRIVED_AT_DESTINATION",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "PENDING_ASSIGNMENT",
      index: true,
    },
    statusHistory: {
      type: [DeliveryStatusHistorySchema],
      default: [],
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
      accuracy: { type: Number },
      updatedAt: { type: Date, default: Date.now },
      locationGeo: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [85.8245, 20.2961],
        },
      },
    },
    assignedAt: { type: Date },
    acceptedAt: { type: Date },
    arrivedPickupAt: { type: Date },
    actualPickupTime: { type: Date },
    pickedUpAt: { type: Date },
    inTransitAt: { type: Date },
    arrivedDestinationAt: { type: Date },
    actualDeliveryTime: { type: Date },
    deliveredAt: { type: Date },
    rejectedAt: { type: Date },
    failedAt: { type: Date },
    rejectionReason: { type: String, default: "" },
    failureReason: { type: String, default: "" },
    temperatureCelsius: {
      type: Number,
      default: 18,
    },
    signatureUrl: {
      type: String,
      default: "",
    },
    otpCode: {
      type: String,
      default: "",
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    proofOfDelivery: {
      otpEntered: { type: String, default: "" },
      isOtpVerified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      location: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
  },
  {
    timestamps: true,
  }
);

DeliverySchema.index({ "currentLocation.locationGeo": "2dsphere" });
DeliverySchema.index({ assignedPartner: 1, status: 1 });

if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as Record<string, unknown>).Delivery;
}

export const Delivery: Model<IDeliveryDocument> =
  mongoose.models.Delivery ||
  mongoose.model<IDeliveryDocument>("Delivery", DeliverySchema);

export default Delivery;
