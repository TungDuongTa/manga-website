import { Schema, model, models } from "mongoose";

const readingProgressSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    comicId: { type: String, default: "" },
    comicSlug: { type: String, required: true, index: true },
    readChapters: { type: [String], default: [] },
    lastReadChapter: { type: String, default: "" },
    lastReadAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

readingProgressSchema.index(
  { userId: 1, comicSlug: 1 },
  {
    unique: true,
    partialFilterExpression: { readChapters: { $exists: true } },
  },
);
readingProgressSchema.index({ userId: 1, lastReadAt: -1 });

export const ReadingProgressModel =
  models.ReadingProgress || model("ReadingProgress", readingProgressSchema);
