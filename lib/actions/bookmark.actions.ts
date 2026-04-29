"use server";

import { revalidatePath } from "next/cache";
import { BookmarkModel } from "@/database/models/bookmark.model";
import { connectToDatabase } from "@/database/mongoose";
import { normalizePageAndSize } from "@/lib/pagination";
import { getCurrentUserId } from "@/lib/server-session";
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

export type PaginatedBookmarksResult = {
  items: BookmarkedComic[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

const DEFAULT_BOOKMARKS_PAGE_SIZE = 24;
const MAX_BOOKMARKS_PAGE_SIZE = 60;

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

const normalizeBookmarksPagination = (page: number, pageSize: number) => ({
  ...normalizePageAndSize(
    page,
    pageSize,
    DEFAULT_BOOKMARKS_PAGE_SIZE,
    MAX_BOOKMARKS_PAGE_SIZE,
  ),
});

export const getCurrentUserBookmarksPage = async ({
  page = 1,
  pageSize = DEFAULT_BOOKMARKS_PAGE_SIZE,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedBookmarksResult> => {
  const userId = await getCurrentUserId();
  const normalized = normalizeBookmarksPagination(page, pageSize);

  if (!userId) {
    return {
      items: [],
      page: normalized.page,
      pageSize: normalized.pageSize,
      totalItems: 0,
      totalPages: 1,
    };
  }

  await connectToDatabase();

  const totalItems = await BookmarkModel.countDocuments({ userId });
  const totalPages = Math.max(1, Math.ceil(totalItems / normalized.pageSize));
  const safePage = Math.min(normalized.page, totalPages);
  const skip = (safePage - 1) * normalized.pageSize;

  const bookmarks = await BookmarkModel.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(normalized.pageSize)
    .lean();

  return {
    items: bookmarks.map(toBookmarkedComic),
    page: safePage,
    pageSize: normalized.pageSize,
    totalItems,
    totalPages,
  };
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
