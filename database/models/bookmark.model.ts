import { Schema, model, models } from "mongoose";

const bookmarkCategorySchema = new Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false },
);

const bookmarkSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    comicId: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    thumbUrl: { type: String, required: true },
    status: { type: String, default: "" },
    comicUpdatedAt: { type: String, default: "" },
    categories: { type: [bookmarkCategorySchema], default: [] },
    latestChapterName: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

bookmarkSchema.index({ userId: 1, slug: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, createdAt: -1 });

export const BookmarkModel =
  models.Bookmark || model("Bookmark", bookmarkSchema);
