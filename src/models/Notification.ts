import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "ORDER_UPDATE"
  | "PRICE_ALERT"
  | "DELIVERY_UPDATE"
  | "DEMAND_SPIKE"
  | "COMMUNITY_POST"
  | "COMMUNITY_COMMENT"
  | "GROUP_INVITE"
  | "BULK_OPPORTUNITY"
  | "AGGREGATION_UPDATE"
  | "SYSTEM";

export interface INotificationDocument extends Document {
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient user reference is required"],
      index: true,
    },
    type: {
      type: String,
      enum: [
        "ORDER_UPDATE",
        "PRICE_ALERT",
        "DELIVERY_UPDATE",
        "DEMAND_SPIKE",
        "COMMUNITY_POST",
        "COMMUNITY_COMMENT",
        "GROUP_INVITE",
        "BULK_OPPORTUNITY",
        "AGGREGATION_UPDATE",
        "SYSTEM",
      ],
      default: "SYSTEM",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
    },
    link: {
      type: String,
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);

export default Notification;
