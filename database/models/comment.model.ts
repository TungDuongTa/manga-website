import { Schema, model, models } from "mongoose";

const commentSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userImage: { type: String, default: "" },
    comicSlug: { type: String, required: true, index: true },
    comicName: { type: String, default: "", index: true },
    targetType: {
      type: String,
      enum: ["manga", "chapter"],
      required: true,
      index: true,
    },
    chapterName: { type: String, default: null },
    parentCommentId: { type: String, default: null, index: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    likeCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ comicSlug: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1, createdAt: -1 });
commentSchema.index({
  comicSlug: 1,
  targetType: 1,
  chapterName: 1,
  parentCommentId: 1,
  createdAt: -1,
});

export const CommentModel = models.Comment || model("Comment", commentSchema);
