import { Schema, model, models } from "mongoose";

const commentLikeSchema = new Schema(
  {
    commentId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

commentLikeSchema.index({ userId: 1, commentId: 1 }, { unique: true });

export const CommentLikeModel =
  models.CommentLike || model("CommentLike", commentLikeSchema);
