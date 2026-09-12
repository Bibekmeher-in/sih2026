/**
 * KISANOVA — Global Type Definitions & Role Constants
 */

export const USER_ROLES = {
  FARMER: "FARMER",
  FPO: "FPO",
  CONSUMER: "CONSUMER",
  BULK_BUYER: "BULK_BUYER",
  ADMIN: "ADMIN",
  DELIVERY_PARTNER: "DELIVERY_PARTNER",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const DELIVERY_PARTNER_VERIFICATION_STATUSES = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  SUSPENDED: "SUSPENDED",
  REJECTED: "REJECTED",
  INACTIVE: "INACTIVE",
} as const;

export type DeliveryPartnerVerificationStatus =
  (typeof DELIVERY_PARTNER_VERIFICATION_STATUSES)[keyof typeof DELIVERY_PARTNER_VERIFICATION_STATUSES];

export type DeliveryVehicleType =
  | "BIKE"
  | "SCOOTER"
  | "THREE_WHEELER"
  | "MINI_TRUCK"
  | "TRUCK"
  | "OTHER";

export type DeliveryAssignmentStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

export type AssignmentMethod = "AI_AUTO" | "ADMIN_MANUAL" | "FALLBACK_AUTO";

export const USER_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
  SUSPENDED: "SUSPENDED",
} as const;

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  phone: string;
  status: UserStatus;
  avatar?: string;
  location?: {
    district?: string;
    state?: string;
    pincode?: string;
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type UnitType = "kg" | "quintal" | "ton" | "crate";

export interface ProduceItem {
  id: string;
  name: string;
  hindiName?: string;
  category: string;
  farmerName: string;
  location: string;
  state: string;
  availableQuantity: number;
  unit: UnitType;
  farmerPrice: number;
  mandiBenchmarkPrice: number;
  grade: "A" | "B" | "Premium Organic";
  harvestDate: string;
  image?: string;
}

export interface HealthResponse {
  status: "ok" | "error";
  database: "connected" | "connecting" | "disconnecting" | "disconnected";
  timestamp: string;
  uptimeSeconds?: number;
}
