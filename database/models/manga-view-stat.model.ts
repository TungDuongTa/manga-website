import { Schema, model, models } from "mongoose";

const mangaViewStatCategorySchema = new Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false },
);

const mangaViewStatSchema = new Schema(
  {
    comicId: { type: String, default: "" },
    comicSlug: { type: String, required: true, unique: true },
    comicName: { type: String, default: "" },
    thumbUrl: { type: String, default: "" },
    status: { type: String, default: "" },
    comicUpdatedAt: { type: String, default: "" },
    categories: { type: [mangaViewStatCategorySchema], default: [] },
    totalViews: { type: Number, default: 0 },
    lastViewedAt: { type: Date, default: null },
    lastViewedChapterName: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

mangaViewStatSchema.index({ totalViews: -1, lastViewedAt: -1 });
mangaViewStatSchema.index({ comicSlug: 1 });

export const MangaViewStatModel =
  models.MangaViewStat || model("MangaViewStat", mangaViewStatSchema);
