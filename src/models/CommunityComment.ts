import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunityCommentDocument extends Document {
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  content: string;
  parentCommentId?: mongoose.Types.ObjectId;
  likes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunityCommentSchema = new Schema<ICommunityCommentDocument>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityPost",
      required: [true, "Post reference is required"],
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author reference is required"],
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorRole: {
      type: String,
      default: "FARMER",
    },
    content: {
      type: String,
      required: [true, "Comment content cannot be empty"],
      trim: true,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityComment",
      default: null,
      index: true,
    },
    likes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

CommunityCommentSchema.index({ postId: 1, createdAt: 1 });

export const CommunityComment: Model<ICommunityCommentDocument> =
  mongoose.models.CommunityComment ||
  mongoose.model<ICommunityCommentDocument>("CommunityComment", CommunityCommentSchema);

export default CommunityComment;
