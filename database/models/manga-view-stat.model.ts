import { Schema, model, models } from "mongoose";

const mangaViewStatSchema = new Schema(
  {
    comicId: { type: String, default: "" },
    comicSlug: { type: String, required: true, unique: true },
    comicName: { type: String, default: "" },
    thumbUrl: { type: String, default: "" },
    comicUpdatedAt: { type: String, default: "" },
    totalViews: { type: Number, default: 0 },
    lastViewedAt: { type: Date, default: null },
    latestChapterName: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

mangaViewStatSchema.index({ totalViews: -1, lastViewedAt: -1 });

export const MangaViewStatModel =
  models.MangaViewStat || model("MangaViewStat", mangaViewStatSchema);
