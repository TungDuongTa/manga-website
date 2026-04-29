"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/database/mongoose";
import { MangaViewStatModel } from "@/database/models/manga-view-stat.model";
import { ReadingProgressModel } from "@/database/models/reading-progress.model";
import { trackMangaChapterView } from "@/lib/actions/manga-view.actions";
import { normalizePageAndSize } from "@/lib/pagination";
import {
  getUserReadingExpStats,
  incrementUserReadingStatsForNewChapter,
} from "@/lib/server/user-level";
import { getCurrentUserId } from "@/lib/server-session";
import type { ReadingExpStats } from "@/lib/user-level";
import type { OTruyenComic } from "@/types/otruyen-types";

type MarkChapterAsReadProgressInput = {
  comicId?: string;
  comicSlug: string;
  chapterName: string;
};

type MarkChapterAsReadProgressResult = {
  success: boolean;
  requiresSignIn?: boolean;
};

type RecordChapterVisitInput = {
  comicId?: string;
  comicSlug: string;
  comicName?: string;
  thumbUrl?: string;
  comicUpdatedAt?: string;
  chapterName: string;
  latestChapterName?: string;
};

type RecordChapterVisitResult = {
  success: boolean;
  progressUpdated: boolean;
};

export type ReadingHistoryComic = OTruyenComic & {
  latestReadAt: string;
  latestReadChapterName: string;
};

export type PaginatedReadingHistoryResult = {
  items: ReadingHistoryComic[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type ReadingProgressDoc = {
  _id?: unknown;
  userId?: string;
  comicId?: string;
  comicSlug?: string;
  readChapters?: string[];
  lastReadChapter?: string;
  lastReadAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

type MangaViewStatDoc = {
  comicId?: string;
  comicSlug?: string;
  comicName?: string;
  thumbUrl?: string;
  comicUpdatedAt?: string;
};

const DEFAULT_READING_HISTORY_PAGE_SIZE = 24;
const MAX_READING_HISTORY_PAGE_SIZE = 60;

const normalizeString = (value: unknown): string => String(value || "").trim();

const uniqueChapterNames = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((chapter) => normalizeString(chapter)).filter(Boolean)),
  );
};

const toIsoDateString = (
  ...values: Array<Date | string | null | undefined>
): string => {
  for (const value of values) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return new Date().toISOString();
};

const resolveHistoryMetadata = (
  comicSlug: string,
  viewStat?: MangaViewStatDoc,
) => {
  const comicId = normalizeString(viewStat?.comicId);
  const name = normalizeString(viewStat?.comicName) || comicSlug;
  const thumbUrl = normalizeString(viewStat?.thumbUrl);
  const comicUpdatedAt = normalizeString(viewStat?.comicUpdatedAt);

  return {
    comicId,
    name,
    thumbUrl,
    comicUpdatedAt,
  };
};

const toReadingHistoryComic = (
  doc: ReadingProgressDoc,
  viewStat?: MangaViewStatDoc,
): ReadingHistoryComic | null => {
  const comicSlug = normalizeString(doc.comicSlug);
  if (!comicSlug) return null;

  const readChapters = uniqueChapterNames(doc.readChapters);
  const latestReadChapterName =
    normalizeString(doc.lastReadChapter) || readChapters[0] || "";
  const latestReadAt = toIsoDateString(
    doc.lastReadAt,
    doc.updatedAt,
    doc.createdAt,
  );
  const metadata = resolveHistoryMetadata(comicSlug, viewStat);

  return {
    _id: metadata.comicId || normalizeString(doc.comicId) || comicSlug,
    name: metadata.name,
    slug: comicSlug,
    origin_name: [],
    status: "ongoing",
    thumb_url: metadata.thumbUrl,
    sub_docquyen: false,
    category: [],
    updatedAt: metadata.comicUpdatedAt || latestReadAt,
    chaptersLatest: latestReadChapterName
      ? [
          {
            filename: "",
            chapter_name: latestReadChapterName,
            chapter_title: "",
            chapter_api_data: "",
          },
        ]
      : [],
    latestReadAt,
    latestReadChapterName,
  };
};

const normalizeHistoryPagination = (page: number, pageSize: number) => ({
  ...normalizePageAndSize(
    page,
    pageSize,
    DEFAULT_READING_HISTORY_PAGE_SIZE,
    MAX_READING_HISTORY_PAGE_SIZE,
  ),
});

export const getCurrentUserReadingExpStats =
  async (): Promise<ReadingExpStats> => {
    const userId = await getCurrentUserId();
    return getUserReadingExpStats(userId);
  };

export const getReadingProgressChapterNames = async (
  comicSlug: string,
): Promise<string[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const normalizedComicSlug = normalizeString(comicSlug);
    if (!normalizedComicSlug) return [];

    await connectToDatabase();
    const row = (await ReadingProgressModel.findOne({
      userId,
      comicSlug: normalizedComicSlug,
      readChapters: { $exists: true },
    })
      .select("readChapters lastReadChapter -_id")
      .lean()) as ReadingProgressDoc | null;

    if (!row) return [];

    const readChapters = uniqueChapterNames(row.readChapters);
    const lastReadChapter = normalizeString(row.lastReadChapter);

    if (lastReadChapter && !readChapters.includes(lastReadChapter)) {
      return [lastReadChapter, ...readChapters];
    }

    return readChapters;
  } catch (error) {
    console.error("Failed to load reading progress chapter names:", error);
    return [];
  }
};

export const getCurrentUserReadingHistoryPage = async ({
  page = 1,
  pageSize = DEFAULT_READING_HISTORY_PAGE_SIZE,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedReadingHistoryResult> => {
  try {
    const userId = await getCurrentUserId();
    const normalized = normalizeHistoryPagination(page, pageSize);

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

    const filter = {
      userId,
      readChapters: { $exists: true },
    };

    const totalItems = await ReadingProgressModel.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalItems / normalized.pageSize));
    const safePage = Math.min(normalized.page, totalPages);
    const skip = (safePage - 1) * normalized.pageSize;

    const rows = (await ReadingProgressModel.find(filter)
      .sort({ lastReadAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(normalized.pageSize)
      .select(
        "comicId comicSlug readChapters lastReadChapter lastReadAt createdAt updatedAt",
      )
      .lean()) as ReadingProgressDoc[];

    if (!rows.length) {
      return {
        items: [],
        page: safePage,
        pageSize: normalized.pageSize,
        totalItems,
        totalPages,
      };
    }

    const slugs = Array.from(
      new Set(
        rows.map((row) => normalizeString(row.comicSlug)).filter(Boolean),
      ),
    );

    const viewStatRows = await MangaViewStatModel.find({
      comicSlug: { $in: slugs },
    })
      .select("comicId comicSlug comicName thumbUrl comicUpdatedAt")
      .lean();

    const viewStatMap = new Map<string, MangaViewStatDoc>(
      viewStatRows.map((row: any) => [normalizeString(row.comicSlug), row]),
    );

    const items = rows
      .map((row) => {
        const slug = normalizeString(row.comicSlug);
        return toReadingHistoryComic(row, viewStatMap.get(slug));
      })
      .filter((item): item is ReadingHistoryComic => Boolean(item));

    return {
      items,
      page: safePage,
      pageSize: normalized.pageSize,
      totalItems,
      totalPages,
    };
  } catch (error) {
    console.error("Failed to load reading history:", error);
    return {
      items: [],
      page: 1,
      pageSize: DEFAULT_READING_HISTORY_PAGE_SIZE,
      totalItems: 0,
      totalPages: 1,
    };
  }
};

export const markChapterAsReadProgress = async (
  input: MarkChapterAsReadProgressInput,
): Promise<MarkChapterAsReadProgressResult> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, requiresSignIn: true };
  }

  const comicSlug = normalizeString(input.comicSlug);
  const chapterName = normalizeString(input.chapterName);
  if (!comicSlug || !chapterName) {
    return { success: false };
  }

  await connectToDatabase();
  const now = new Date();
  const previousDoc = (await ReadingProgressModel.findOneAndUpdate(
    {
      userId,
      comicSlug,
      readChapters: { $exists: true },
    },
    {
      $set: {
        comicId: normalizeString(input.comicId),
        lastReadChapter: chapterName,
        lastReadAt: now,
      },
      $addToSet: { readChapters: chapterName },
      $setOnInsert: {
        userId,
        comicSlug,
      },
    },
    {
      upsert: true,
      returnDocument: "before",
      lean: true,
    },
  )) as ReadingProgressDoc | null;

  const alreadyRead = uniqueChapterNames(previousDoc?.readChapters).includes(
    chapterName,
  );
  const didInsertNewRead = !previousDoc || !alreadyRead;

  if (didInsertNewRead) {
    try {
      await incrementUserReadingStatsForNewChapter(userId, 1);
    } catch (error) {
      console.error("Failed to increment user reading stats:", error);
    }
  }

  if (didInsertNewRead) {
    revalidatePath(`/manga/${comicSlug}`);
    revalidatePath("/bookmarks");
  }

  return { success: true };
};

export const recordChapterVisit = async (
  input: RecordChapterVisitInput,
): Promise<RecordChapterVisitResult> => {
  const [viewResult, progressResult] = await Promise.allSettled([
    trackMangaChapterView({
      comicId: input.comicId,
      comicSlug: input.comicSlug,
      comicName: input.comicName,
      thumbUrl: input.thumbUrl,
      comicUpdatedAt: input.comicUpdatedAt,
      chapterName: input.chapterName,
      latestChapterName: input.latestChapterName,
    }),
    markChapterAsReadProgress({
      comicId: input.comicId,
      comicSlug: input.comicSlug,
      chapterName: input.chapterName,
    }),
  ]);

  const trackedView =
    viewResult.status === "fulfilled" && Boolean(viewResult.value.success);
  const updatedProgress =
    progressResult.status === "fulfilled" &&
    Boolean(progressResult.value.success) &&
    !progressResult.value.requiresSignIn;

  return {
    success: trackedView,
    progressUpdated: updatedProgress,
  };
};
