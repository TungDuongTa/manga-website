import { Schema, model, models } from "mongoose";

const mangaViewSchema = new Schema(
  {
    comicId: { type: String, default: "" },
    comicSlug: { type: String, required: true, index: true },
    comicName: { type: String, default: "" },
    thumbUrl: { type: String, default: "" },
    comicUpdatedAt: { type: String, default: "" },
    dayBucket: { type: Date, required: true, index: true },
    views: { type: Number, default: 0 },
    lastViewedAt: { type: Date, default: null },
    latestChapterName: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

mangaViewSchema.index(
  { comicSlug: 1, dayBucket: 1 },
  {
    unique: true,
    partialFilterExpression: { dayBucket: { $type: "date" } },
  },
);
mangaViewSchema.index({ dayBucket: -1, comicSlug: 1 });
mangaViewSchema.index({ comicSlug: 1, dayBucket: -1, lastViewedAt: -1 });

export const MangaViewModel = models.MangaView || model("MangaView", mangaViewSchema);
