import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRouteWaypoint {
  name: string;
  sequence: number;
  latitude: number;
  longitude: number;
  stopType: "FARM_GATE_PICKUP" | "FPO_HUB" | "REST_STOP" | "DROP_OFF";
  estimatedStopMinutes: number;
}

export interface IRouteDocument extends Document {
  name: string;
  code: string;
  origin: {
    name: string;
    address: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    name: string;
    address: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  waypoints: IRouteWaypoint[];
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  tollCount?: number;
  roadQuality: "EXPRESSWAY" | "NATIONAL_HIGHWAY" | "STATE_HIGHWAY" | "RURAL_ROAD";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WaypointSchema = new Schema<IRouteWaypoint>({
  name: { type: String, required: true },
  sequence: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  stopType: {
    type: String,
    enum: ["FARM_GATE_PICKUP", "FPO_HUB", "REST_STOP", "DROP_OFF"],
    default: "FARM_GATE_PICKUP",
  },
  estimatedStopMinutes: { type: Number, default: 15 },
});

const RouteSchema = new Schema<IRouteDocument>(
  {
    name: {
      type: String,
      required: [true, "Route name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    origin: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    destination: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    waypoints: {
      type: [WaypointSchema],
      default: [],
    },
    totalDistanceKm: {
      type: Number,
      required: [true, "Total distance in km is required"],
      min: [0.5, "Distance must be at least 0.5 km"],
    },
    estimatedDurationMinutes: {
      type: Number,
      required: [true, "Estimated duration in minutes is required"],
      min: [5, "Duration must be at least 5 minutes"],
    },
    tollCount: {
      type: Number,
      default: 0,
    },
    roadQuality: {
      type: String,
      enum: ["EXPRESSWAY", "NATIONAL_HIGHWAY", "STATE_HIGHWAY", "RURAL_ROAD"],
      default: "NATIONAL_HIGHWAY",
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

export const Route: Model<IRouteDocument> =
  mongoose.models.Route || mongoose.model<IRouteDocument>("Route", RouteSchema);

export default Route;
