import { Schema, model, models } from "mongoose";

const readChapterSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    comicId: { type: String, default: "" },
    comicSlug: { type: String, required: true, index: true },
    comicName: { type: String, default: "" },
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

export const ReadChapterModel =
  models.ReadChapter || model("ReadChapter", readChapterSchema);
