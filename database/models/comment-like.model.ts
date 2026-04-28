import { Schema, model, models } from "mongoose";

const commentLikeSchema = new Schema(
  {
    commentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  },
);

commentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });
commentLikeSchema.index({ userId: 1, createdAt: -1 });

export const CommentLikeModel =
  models.CommentLike || model("CommentLike", commentLikeSchema);

