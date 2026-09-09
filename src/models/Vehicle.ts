import mongoose, { Schema, Document, Model } from "mongoose";

export type VehicleClassType =
  | "TATA_ACE"
  | "EICHER_407"
  | "MEDIUM_TRUCK"
  | "HEAVY_MULTI_AXLE"
  | "COLD_CHAIN_REEFER";

export type VehicleStatusType = "AVAILABLE" | "ON_TRIP" | "MAINTENANCE" | "OFF_DUTY";

export interface IVehicleDocument extends Document {
  registrationNumber: string;
  vehicleClass: VehicleClassType;
  modelName: string;
  payloadCapacityKg: number;
  fuelType: "DIESEL" | "CNG" | "ELECTRIC";
  isRefrigerated: boolean;
  driverName: string;
  driverPhone: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    lastReportedAt: Date;
  };
  status: VehicleStatusType;
  baseHub: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicleDocument>(
  {
    registrationNumber: {
      type: String,
      required: [true, "Vehicle registration number is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    vehicleClass: {
      type: String,
      enum: [
        "TATA_ACE",
        "EICHER_407",
        "MEDIUM_TRUCK",
        "HEAVY_MULTI_AXLE",
        "COLD_CHAIN_REEFER",
      ],
      default: "TATA_ACE",
      required: true,
    },
    modelName: {
      type: String,
      default: "Tata Ace Gold",
    },
    payloadCapacityKg: {
      type: Number,
      required: [true, "Payload capacity in kg is required"],
      min: [500, "Capacity must be at least 500 kg"],
      default: 1000,
    },
    fuelType: {
      type: String,
      enum: ["DIESEL", "CNG", "ELECTRIC"],
      default: "DIESEL",
    },
    isRefrigerated: {
      type: Boolean,
      default: false,
    },
    driverName: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
    },
    driverPhone: {
      type: String,
      required: [true, "Driver phone is required"],
      trim: true,
    },
    currentLocation: {
      latitude: { type: Number, default: 19.9975 },
      longitude: { type: Number, default: 73.7898 },
      lastReportedAt: { type: Date, default: Date.now },
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "ON_TRIP", "MAINTENANCE", "OFF_DUTY"],
      default: "AVAILABLE",
      index: true,
    },
    baseHub: {
      type: String,
      default: "Nashik Central Agri Logistics Center",
    },
  },
  {
    timestamps: true,
  }
);

export const Vehicle: Model<IVehicleDocument> =
  mongoose.models.Vehicle ||
  mongoose.model<IVehicleDocument>("Vehicle", VehicleSchema);

export default Vehicle;
