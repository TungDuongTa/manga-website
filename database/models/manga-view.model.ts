import { Schema, model, models } from "mongoose";

const mangaViewCategorySchema = new Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false },
);

const mangaViewSchema = new Schema(
  {
    comicId: { type: String, default: "" },
    comicSlug: { type: String, required: true, index: true },
    comicName: { type: String, default: "" },
    thumbUrl: { type: String, default: "" },
    status: { type: String, default: "" },
    comicUpdatedAt: { type: String, default: "" },
    categories: { type: [mangaViewCategorySchema], default: [] },
    chapterName: { type: String, required: true },
    viewedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  },
);

mangaViewSchema.index({ comicSlug: 1, viewedAt: -1 });
mangaViewSchema.index({ comicSlug: 1, chapterName: 1, viewedAt: -1 });
mangaViewSchema.index({ viewedAt: -1, comicSlug: 1 });
mangaViewSchema.index({ comicSlug: 1, viewedAt: -1, updatedAt: -1 });

export const MangaViewModel = models.MangaView || model("MangaView", mangaViewSchema);
