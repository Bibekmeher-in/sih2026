import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWebhookEventDocument extends Document {
  eventId: string;
  eventType: string;
  processedAt: Date;
  payloadSummary?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEventDocument>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    payloadSummary: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as Record<string, unknown>).WebhookEvent;
}

export const WebhookEvent: Model<IWebhookEventDocument> =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEventDocument>("WebhookEvent", WebhookEventSchema);

export default WebhookEvent;
