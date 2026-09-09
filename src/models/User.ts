import mongoose, { Schema, Document, Model } from "mongoose";
import { USER_ROLES, USER_STATUSES, UserRole, UserStatus } from "@/types";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
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
  farmerProfile?: mongoose.Types.ObjectId;
  fpoProfile?: mongoose.Types.ObjectId;
  buyerProfile?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): Omit<IUserDocument, "passwordHash">;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: "{VALUE} is not a valid role",
      },
      required: [true, "User role is required"],
      default: USER_ROLES.CONSUMER,
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(USER_STATUSES),
        message: "{VALUE} is not a valid status",
      },
      default: USER_STATUSES.ACTIVE,
      index: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    location: {
      district: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    farmerProfile: {
      type: Schema.Types.ObjectId,
      ref: "FarmerProfile",
    },
    fpoProfile: {
      type: Schema.Types.ObjectId,
      ref: "FPO",
    },
    buyerProfile: {
      type: Schema.Types.ObjectId,
      ref: "BuyerProfile",
    },
  },
  {
    timestamps: true,
  }
);

// Method to strip passwordHash from responses
UserSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
