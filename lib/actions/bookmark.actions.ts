"use server";

import { revalidatePath } from "next/cache";
import { BookmarkModel } from "@/database/models/bookmark.model";
import { connectToDatabase } from "@/database/mongoose";
import { getManga18Detail } from "@/lib/actions/manga18.actions";
import { getComicDetail } from "@/lib/actions/otruyen-actions";
import { normalizePageAndSize } from "@/lib/pagination";
import {
  DEFAULT_MANGA_ROUTE_BASE,
  normalizeMangaRouteBase,
  resolveMangaRouteBases,
  type MangaRouteBase,
} from "@/lib/server/manga-route";
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
  routeBase?: MangaRouteBase;
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

type LiveBookmarkFields = {
  name?: string;
  thumbUrl?: string;
  status?: string;
  comicUpdatedAt?: string;
  categories?: Category[];
  latestChapterName?: string;
};

const LIVE_SYNC_CONCURRENCY = 6;

const toTimeMs = (value: unknown): number => {
  const time = new Date(String(value || "")).getTime();
  return Number.isFinite(time) ? time : 0;
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  if (!items.length) return [];
  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: safeConcurrency }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) {
        return;
      }
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
};

const getLatestChapterNameFromDetail = (chapters: any): string => {
  const serverData = Array.isArray(chapters?.[0]?.server_data)
    ? chapters[0].server_data
    : [];
  if (!serverData.length) return "";
  return String(serverData[serverData.length - 1]?.chapter_name || "").trim();
};

const getLiveBookmarkFields = async (
  slug: string,
  routeBase: MangaRouteBase,
): Promise<LiveBookmarkFields | null> => {
  if (!slug) return null;

  try {
    const detail =
      routeBase === "/18+"
        ? await getManga18Detail(slug)
        : (await getComicDetail(slug))?.item;
    if (!detail) return null;

    return {
      name: detail.name,
      thumbUrl: detail.thumb_url,
      status: detail.status,
      comicUpdatedAt: detail.updatedAt,
      categories: detail.category,
      latestChapterName: getLatestChapterNameFromDetail(detail.chapters),
    };
  } catch (error) {
    console.error(`Failed to load live bookmark fields for "${slug}":`, error);
    return null;
  }
};

const toBookmarkedComic = (
  doc: any,
  routeBase: MangaRouteBase,
): BookmarkedComic => ({
  _id: doc.comicId || doc.slug,
  name: doc.name,
  slug: doc.slug,
  routeBase,
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

  const bookmarks = await BookmarkModel.find({ userId })
    .lean();

  const totalItems = bookmarks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalized.pageSize));
  const safePage = Math.min(normalized.page, totalPages);
  const bookmarkSlugs = bookmarks.map((bookmark: any) =>
    String(bookmark.slug || ""),
  );
  const inferredRouteMap = await resolveMangaRouteBases(bookmarkSlugs);
  const routeResolvedBookmarks = bookmarks.map((bookmark: any) => {
    const slug = String(bookmark.slug || "").trim();
    const explicitRoute = normalizeMangaRouteBase(bookmark.routeBase);
    const inferredRoute = inferredRouteMap.get(slug) || DEFAULT_MANGA_ROUTE_BASE;
    return {
      bookmark,
      slug,
      routeBase: explicitRoute || inferredRoute,
    };
  });
  const enrichedBookmarks = await mapWithConcurrency(
    routeResolvedBookmarks,
    LIVE_SYNC_CONCURRENCY,
    async ({ bookmark, slug, routeBase }) => {
      const live = await getLiveBookmarkFields(slug, routeBase);
      const mergedBookmark = live
        ? {
            ...bookmark,
            name: live.name || bookmark.name,
            thumbUrl: live.thumbUrl || bookmark.thumbUrl,
            status: live.status || bookmark.status,
            comicUpdatedAt: live.comicUpdatedAt || bookmark.comicUpdatedAt,
            categories:
              Array.isArray(live.categories) && live.categories.length > 0
                ? live.categories
                : bookmark.categories,
            latestChapterName:
              live.latestChapterName || bookmark.latestChapterName,
          }
        : { ...bookmark };

      return {
        bookmark,
        mergedBookmark,
        routeBase,
      };
    },
  );

  const updateOps = enrichedBookmarks
    .filter(({ bookmark, mergedBookmark, routeBase }) => {
      const categoriesChanged =
        JSON.stringify(bookmark.categories || []) !==
        JSON.stringify(mergedBookmark.categories || []);
      return (
        String(bookmark.routeBase || "") !== String(routeBase) ||
        String(bookmark.name || "") !== String(mergedBookmark.name || "") ||
        String(bookmark.thumbUrl || "") !==
          String(mergedBookmark.thumbUrl || "") ||
        String(bookmark.status || "") !== String(mergedBookmark.status || "") ||
        String(bookmark.comicUpdatedAt || "") !==
          String(mergedBookmark.comicUpdatedAt || "") ||
        String(bookmark.latestChapterName || "") !==
          String(mergedBookmark.latestChapterName || "") ||
        categoriesChanged
      );
    })
    .map(({ bookmark, mergedBookmark, routeBase }) => ({
      updateOne: {
        filter: { _id: bookmark._id },
        update: {
          $set: {
            routeBase,
            name: mergedBookmark.name,
            thumbUrl: mergedBookmark.thumbUrl,
            status: mergedBookmark.status,
            comicUpdatedAt: mergedBookmark.comicUpdatedAt,
            categories: mergedBookmark.categories || [],
            latestChapterName: mergedBookmark.latestChapterName || "",
          },
        },
      },
    }));

  if (updateOps.length > 0) {
    await BookmarkModel.bulkWrite(updateOps, { ordered: false });
  }

  const sortedMergedBookmarks = enrichedBookmarks
    .map(({ mergedBookmark, routeBase }) => ({ mergedBookmark, routeBase }))
    .sort((a, b) => {
      const updatedDiff =
        toTimeMs(b.mergedBookmark.comicUpdatedAt) -
        toTimeMs(a.mergedBookmark.comicUpdatedAt);
      if (updatedDiff !== 0) return updatedDiff;

      return (
        toTimeMs(b.mergedBookmark.createdAt) - toTimeMs(a.mergedBookmark.createdAt)
      );
    });
  const skip = (safePage - 1) * normalized.pageSize;
  const liveItems = sortedMergedBookmarks
    .slice(skip, skip + normalized.pageSize)
    .map(({ mergedBookmark, routeBase }) =>
      toBookmarkedComic(mergedBookmark, routeBase),
    );

  return {
    items: liveItems,
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
      message: "Vui lòng đăng nhập để đánh dấu truyện tranh.",
      bookmarked: false,
      requiresSignIn: true,
    };
  }

  await connectToDatabase();

  const existing = await BookmarkModel.findOne({
    userId,
    slug: input.slug,
  }).select("_id routeBase");
  const routeBase =
    normalizeMangaRouteBase(input.routeBase) || DEFAULT_MANGA_ROUTE_BASE;

  if (existing) {
    await BookmarkModel.deleteOne({ _id: existing._id });
    revalidatePath("/bookmarks");
    revalidatePath(`/manga/${input.slug}`);
    revalidatePath(`/18+/${input.slug}`);

    return {
      success: true,
      message: "Đã xóa khỏi danh sách theo dõi",
      bookmarked: false,
    };
  }

  try {
    await BookmarkModel.create({
      userId,
      comicId: input.comicId,
      slug: input.slug,
      routeBase,
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
    revalidatePath(`/18+/${input.slug}`);

    return {
      success: true,
      message: "Đã thêm vào danh sách theo dõi",
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
  revalidatePath(`/18+/${slug}`);
};
