import mongoose, { Schema, Document, Model } from "mongoose";
import { UnitType } from "@/types";

export interface IInventoryDocument extends Document {
  product: mongoose.Types.ObjectId;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unit: UnitType;
  storageType?: "COLD_STORAGE" | "AMBIENT_WAREHOUSE" | "FARM_GATE_SILO";
  batchNumber?: string;
  lastStockUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
  reserve(quantity: number): Promise<void>;
  release(quantity: number): Promise<void>;
  consume(quantity: number): Promise<void>;
}

const InventorySchema = new Schema<IInventoryDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      unique: true,
      index: true,
    },
    currentQuantity: {
      type: Number,
      required: [true, "Current physical stock quantity is required"],
      min: [0, "Current quantity cannot be negative"],
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      required: [true, "Reserved quantity is required"],
      min: [0, "Reserved quantity cannot be negative"],
      default: 0,
    },
    availableQuantity: {
      type: Number,
      required: [true, "Available quantity is required"],
      min: [0, "Available quantity cannot be negative"],
      default: 0,
      index: true,
    },
    unit: {
      type: String,
      enum: ["kg", "quintal", "ton", "crate"],
      default: "kg",
      required: true,
    },
    storageType: {
      type: String,
      enum: ["COLD_STORAGE", "AMBIENT_WAREHOUSE", "FARM_GATE_SILO"],
      default: "AMBIENT_WAREHOUSE",
    },
    batchNumber: {
      type: String,
      default: "",
    },
    lastStockUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save recalculation & negative stock safeguard
InventorySchema.pre("save", function () {
  this.availableQuantity = Math.max(0, this.currentQuantity - this.reservedQuantity);
  if (this.currentQuantity < this.reservedQuantity) {
    throw new Error(
      `Inventory violation: Reserved quantity (${this.reservedQuantity}) exceeds current stock (${this.currentQuantity})`
    );
  }
  this.lastStockUpdate = new Date();
});

InventorySchema.methods.reserve = async function (quantity: number) {
  if (quantity <= 0) throw new Error("Reservation quantity must be greater than zero");
  if (this.availableQuantity < quantity) {
    throw new Error(
      `Insufficient inventory: requested ${quantity}, available ${this.availableQuantity}`
    );
  }
  this.reservedQuantity += quantity;
  this.availableQuantity = Math.max(0, this.currentQuantity - this.reservedQuantity);
  this.lastStockUpdate = new Date();
  await this.save();
};

InventorySchema.methods.release = async function (quantity: number) {
  if (quantity <= 0) throw new Error("Release quantity must be greater than zero");
  this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
  this.availableQuantity = Math.max(0, this.currentQuantity - this.reservedQuantity);
  this.lastStockUpdate = new Date();
  await this.save();
};

InventorySchema.methods.consume = async function (quantity: number) {
  if (quantity <= 0) throw new Error("Consume quantity must be greater than zero");
  this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
  this.currentQuantity = Math.max(0, this.currentQuantity - quantity);
  this.availableQuantity = Math.max(0, this.currentQuantity - this.reservedQuantity);
  this.lastStockUpdate = new Date();
  await this.save();
};

export const Inventory: Model<IInventoryDocument> =
  mongoose.models.Inventory ||
  mongoose.model<IInventoryDocument>("Inventory", InventorySchema);

export default Inventory;
