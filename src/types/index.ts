/**
 * KisanDirect — Global Type Definitions & Role Constants
 */

export const USER_ROLES = {
  FARMER: "FARMER",
  FPO: "FPO",
  CONSUMER: "CONSUMER",
  BULK_BUYER: "BULK_BUYER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

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
