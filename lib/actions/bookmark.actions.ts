"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { BookmarkModel } from "@/database/models/bookmark.model";
import { connectToDatabase } from "@/database/mongoose";
import { auth } from "@/lib/better-auth/auth";
import type { Category, OTruyenComic } from "@/types/otruyen-types";

type ToggleBookmarkInput = {
  comicId: string;
  slug: string;
  name: string;
  thumbUrl: string;
  status: string;
  comicUpdatedAt: string;
  categories: Category[];
  latestChapterName?: string;
};

type BookmarkActionResult = {
  success: boolean;
  message: string;
  bookmarked: boolean;
  requiresSignIn?: boolean;
};

export type BookmarkedComic = OTruyenComic & {
  bookmarkedAt: string;
};

const getCurrentUserId = async (): Promise<string | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user?.id ?? null;
};

const toBookmarkedComic = (doc: any): BookmarkedComic => ({
  _id: doc.comicId || doc.slug,
  name: doc.name,
  slug: doc.slug,
  origin_name: [],
  status: doc.status || "ongoing",
  thumb_url: doc.thumbUrl,
  sub_docquyen: false,
  category: Array.isArray(doc.categories) ? doc.categories : [],
  updatedAt:
    doc.comicUpdatedAt ||
    new Date(doc.updatedAt || doc.createdAt || Date.now()).toISOString(),
  chaptersLatest: doc.latestChapterName
    ? [
        {
          filename: "",
          chapter_name: doc.latestChapterName,
          chapter_title: "",
          chapter_api_data: "",
        },
      ]
    : [],
  bookmarkedAt: new Date(doc.createdAt || Date.now()).toISOString(),
});

export const getCurrentUserBookmarks = async (): Promise<BookmarkedComic[]> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }

  await connectToDatabase();
  const bookmarks = await BookmarkModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return bookmarks.map(toBookmarkedComic);
};

export const isMangaBookmarked = async (slug: string): Promise<boolean> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }

  await connectToDatabase();
  const existing = await BookmarkModel.findOne({ userId, slug }).select("_id");
  return Boolean(existing);
};

export const toggleMangaBookmark = async (
  input: ToggleBookmarkInput,
): Promise<BookmarkActionResult> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      success: false,
      message: "Please sign in to bookmark manga.",
      bookmarked: false,
      requiresSignIn: true,
    };
  }

  await connectToDatabase();

  const existing = await BookmarkModel.findOne({
    userId,
    slug: input.slug,
  }).select("_id");

  if (existing) {
    await BookmarkModel.deleteOne({ _id: existing._id });
    revalidatePath("/bookmarks");
    revalidatePath(`/manga/${input.slug}`);

    return {
      success: true,
      message: "Removed from bookmarks.",
      bookmarked: false,
    };
  }

  try {
    await BookmarkModel.create({
      userId,
      comicId: input.comicId,
      slug: input.slug,
      name: input.name,
      thumbUrl: input.thumbUrl,
      status: input.status,
      comicUpdatedAt: input.comicUpdatedAt,
      categories: (input.categories || []).map((category) => ({
        id: category.id || "",
        name: category.name,
        slug: category.slug,
      })),
      latestChapterName: input.latestChapterName || "",
    });

    revalidatePath("/bookmarks");
    revalidatePath(`/manga/${input.slug}`);

    return {
      success: true,
      message: "Added to bookmarks.",
      bookmarked: true,
    };
  } catch (error: any) {
    if (error?.code === 11000) {
      return {
        success: true,
        message: "Already in bookmarks.",
        bookmarked: true,
      };
    }

    console.error("Failed to toggle bookmark:", error);
    return {
      success: false,
      message: "Could not update bookmark right now. Please try again.",
      bookmarked: false,
    };
  }
};

export const removeMangaBookmark = async (slug: string): Promise<void> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return;
  }

  await connectToDatabase();
  await BookmarkModel.deleteOne({ userId, slug });
  revalidatePath("/bookmarks");
  revalidatePath(`/manga/${slug}`);
};
