import mongoose, { Schema, Document, Model } from "mongoose";
import {
  DELIVERY_PARTNER_VERIFICATION_STATUSES,
  DeliveryPartnerVerificationStatus,
  DeliveryVehicleType,
} from "@/types";

export interface IDeliveryPartnerProfileDocument extends Document {
  user: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  email: string;
  profilePhoto?: string;
  verificationStatus: DeliveryPartnerVerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  suspensionReason?: string;
  vehicleType: DeliveryVehicleType;
  vehicleNumber: string;
  vehicleCapacityKg: number;
  documents: {
    governmentIdType?: "AADHAAR" | "PAN" | "VOTER_ID";
    governmentIdNumber?: string;
    drivingLicenseNumber?: string;
    drivingLicenseExpiry?: Date;
    vehicleRegistrationNumber?: string;
    insuranceExpiry?: Date;
  };
  isOnline: boolean;
  isAvailableForAssignment: boolean;
  lastActiveAt?: Date;
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    updatedAt: Date;
    locationGeo: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  serviceArea: {
    city: string;
    radiusKm: number;
  };
  statistics: {
    totalAssignedDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    failedDeliveries: number;
    averageDeliveryTimeMinutes: number;
    rating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryPartnerProfileSchema = new Schema<IDeliveryPartnerProfileDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    verificationStatus: {
      type: String,
      enum: Object.values(DELIVERY_PARTNER_VERIFICATION_STATUSES),
      default: DELIVERY_PARTNER_VERIFICATION_STATUSES.PENDING_VERIFICATION,
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    suspensionReason: {
      type: String,
      default: "",
    },
    vehicleType: {
      type: String,
      enum: ["BIKE", "SCOOTER", "THREE_WHEELER", "MINI_TRUCK", "TRUCK", "OTHER"],
      default: "BIKE",
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, "Vehicle registration number is required"],
      uppercase: true,
      trim: true,
      index: true,
    },
    vehicleCapacityKg: {
      type: Number,
      required: [true, "Vehicle capacity in kg is required"],
      min: [5, "Capacity must be at least 5 kg"],
      default: 40,
    },
    documents: {
      governmentIdType: {
        type: String,
        enum: ["AADHAAR", "PAN", "VOTER_ID"],
        default: "AADHAAR",
      },
      governmentIdNumber: { type: String, default: "" },
      drivingLicenseNumber: { type: String, default: "" },
      drivingLicenseExpiry: { type: Date },
      vehicleRegistrationNumber: { type: String, default: "" },
      insuranceExpiry: { type: Date },
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    isAvailableForAssignment: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    currentLocation: {
      latitude: { type: Number, default: 20.2961 }, // Default Odisha region
      longitude: { type: Number, default: 85.8245 },
      accuracy: { type: Number, default: 10 },
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
    serviceArea: {
      city: { type: String, default: "Bhubaneswar" },
      radiusKm: { type: Number, default: 30, min: 1 },
    },
    statistics: {
      totalAssignedDeliveries: { type: Number, default: 0 },
      completedDeliveries: { type: Number, default: 0 },
      cancelledDeliveries: { type: Number, default: 0 },
      failedDeliveries: { type: Number, default: 0 },
      averageDeliveryTimeMinutes: { type: Number, default: 35 },
      rating: { type: Number, default: 4.8, min: 1, max: 5 },
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial proximity search
DeliveryPartnerProfileSchema.index({ "currentLocation.locationGeo": "2dsphere" });
// Compound index for active candidate eligibility filtering
DeliveryPartnerProfileSchema.index({
  verificationStatus: 1,
  isOnline: 1,
  isAvailableForAssignment: 1,
});

if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as Record<string, unknown>).DeliveryPartnerProfile;
}

export const DeliveryPartnerProfile: Model<IDeliveryPartnerProfileDocument> =
  mongoose.models.DeliveryPartnerProfile ||
  mongoose.model<IDeliveryPartnerProfileDocument>(
    "DeliveryPartnerProfile",
    DeliveryPartnerProfileSchema
  );

export default DeliveryPartnerProfile;
