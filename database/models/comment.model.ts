import { Schema, model, models } from "mongoose";

const commentSchema = new Schema(
  {
    userId: { type: String, required: true },
    comicSlug: { type: String, required: true },
    comicName: { type: String, default: "" },
    targetType: {
      type: String,
      enum: ["manga", "chapter"],
      required: true,
    },
    chapterName: { type: String, default: null },
    parentCommentId: { type: Schema.Types.ObjectId, default: null },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    likeCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ userId: 1 });
commentSchema.index({ parentCommentId: 1, createdAt: -1 });
commentSchema.index({ comicSlug: 1, parentCommentId: 1, createdAt: -1 });
commentSchema.index({
  comicSlug: 1,
  targetType: 1,
  chapterName: 1,
  parentCommentId: 1,
  createdAt: -1,
});

export const CommentModel = models.Comment || model("Comment", commentSchema);
