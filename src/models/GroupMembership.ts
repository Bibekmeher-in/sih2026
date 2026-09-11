import mongoose, { Schema, Document, Model } from "mongoose";

export type MembershipRole = "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
export type MembershipStatus = "PENDING" | "ACTIVE" | "REMOVED" | "BANNED";

export interface IGroupMembershipDocument extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GroupMembershipSchema = new Schema<IGroupMembershipDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "FarmerGroup",
      required: [true, "Group reference is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MODERATOR", "MEMBER"],
      default: "MEMBER",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REMOVED", "BANNED"],
      default: "ACTIVE",
      required: true,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one membership record per group
GroupMembershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const GroupMembership: Model<IGroupMembershipDocument> =
  mongoose.models.GroupMembership ||
  mongoose.model<IGroupMembershipDocument>("GroupMembership", GroupMembershipSchema);

export default GroupMembership;
