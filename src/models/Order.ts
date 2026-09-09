import mongoose, { Schema, Document, Model } from "mongoose";
import { UnitType } from "@/types";

export type OrderStatusType =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "ASSIGNED_FOR_DELIVERY"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatusType =
  | "PENDING"
  | "PAID"
  | "ESCROW_HELD"
  | "RELEASED_TO_SELLER"
  | "REFUNDED";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  totalItemPrice: number;
}

export interface IOrderAddress {
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  district: string;
  state: string;
  pincode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface IOrderDocument extends Document {
  orderNumber: string;
  buyer: mongoose.Types.ObjectId;
  buyerType: "CONSUMER" | "BULK_BUYER";
  seller: mongoose.Types.ObjectId;
  sellerType: "User" | "FarmerProfile" | "FPO";
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: IOrderAddress;
  orderStatus: OrderStatusType;
  paymentStatus: PaymentStatusType;
  paymentMethod: "UPI" | "DIRECT_BANK_TRANSFER" | "CASH_ON_DELIVERY" | "NET_BANKING";
  deliveryId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.1, "Quantity must be greater than 0"],
    },
    unit: {
      type: String,
      enum: ["kg", "quintal", "ton", "crate"],
      default: "kg",
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative"],
    },
    totalItemPrice: {
      type: Number,
      required: true,
      min: [0, "Total item price cannot be negative"],
    },
  },
  { _id: false }
);

const OrderAddressSchema = new Schema<IOrderAddress>(
  {
    recipientName: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    addressLine: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, default: 19.076 }, // Default Mumbai lat
      longitude: { type: Number, default: 72.8777 },
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer reference is required"],
      index: true,
    },
    buyerType: {
      type: String,
      enum: ["CONSUMER", "BULK_BUYER"],
      default: "CONSUMER",
    },
    seller: {
      type: Schema.Types.ObjectId,
      refPath: "sellerType",
      required: [true, "Seller reference is required"],
      index: true,
    },
    sellerType: {
      type: String,
      enum: ["User", "FarmerProfile", "FPO"],
      default: "User",
    },
    items: {
      type: [OrderItemSchema],
      required: [true, "Order must contain at least one item"],
      validate: [
        (val: IOrderItem[]) => val.length > 0,
        "Order must contain at least 1 item",
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, "Delivery fee cannot be negative"],
    },
    total: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },
    deliveryAddress: {
      type: OrderAddressSchema,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "READY_FOR_PICKUP",
        "ASSIGNED_FOR_DELIVERY",
        "IN_TRANSIT",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "ESCROW_HELD", "RELEASED_TO_SELLER", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "DIRECT_BANK_TRANSFER", "CASH_ON_DELIVERY", "NET_BANKING"],
      default: "UPI",
    },
    deliveryId: {
      type: Schema.Types.ObjectId,
      ref: "Delivery",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Server-side deterministic recalculation hook
OrderSchema.pre("save", function () {
  let computedSubtotal = 0;
  for (const item of this.items) {
    item.totalItemPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
    computedSubtotal += item.totalItemPrice;
  }
  this.subtotal = Math.round(computedSubtotal * 100) / 100;
  this.total = Math.round((this.subtotal + (this.deliveryFee || 0)) * 100) / 100;
});

export const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>("Order", OrderSchema);

export default Order;
