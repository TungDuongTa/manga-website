import { Schema, model, models } from "mongoose";

const readChapterCategorySchema = new Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false },
);

const readChapterSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    comicId: { type: String, default: "" },
    comicSlug: { type: String, required: true, index: true },
    comicName: { type: String, default: "" },
    thumbUrl: { type: String, default: "" },
    status: { type: String, default: "" },
    comicUpdatedAt: { type: String, default: "" },
    categories: { type: [readChapterCategorySchema], default: [] },
    chapterName: { type: String, required: true },
    readAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

readChapterSchema.index(
  { userId: 1, comicSlug: 1, chapterName: 1 },
  { unique: true },
);
readChapterSchema.index({ userId: 1, comicSlug: 1, readAt: -1 });
readChapterSchema.index({ userId: 1, readAt: -1 });

export const ReadChapterModel =
  models.ReadChapter || model("ReadChapter", readChapterSchema);
