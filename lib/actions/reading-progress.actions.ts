"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/database/mongoose";
import { MangaViewStatModel } from "@/database/models/manga-view-stat.model";
import { ReadingProgressModel } from "@/database/models/reading-progress.model";
import {
  getUserReadingExpStats,
  incrementUserReadingStatsForNewChapter,
} from "@/lib/server/user-level";
import { getCurrentUserId } from "@/lib/server-session";
import type { ReadingExpStats } from "@/lib/user-level";
import type { Category, OTruyenComic } from "@/types/otruyen-types";

type MarkChapterAsReadProgressInput = {
  comicId?: string;
  comicSlug: string;
  chapterName: string;
};

type MarkChapterAsReadProgressResult = {
  success: boolean;
  requiresSignIn?: boolean;
};

export type ReadingHistoryComic = OTruyenComic & {
  latestReadAt: string;
  latestReadChapterName: string;
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
  status?: string;
  comicUpdatedAt?: string;
  categories?: Category[];
};

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
  const name =
    normalizeString(viewStat?.comicName) || comicSlug;
  const thumbUrl = normalizeString(viewStat?.thumbUrl);
  const status =
    normalizeString(viewStat?.status) || "ongoing";
  const comicUpdatedAt = normalizeString(viewStat?.comicUpdatedAt);
  const categories = Array.isArray(viewStat?.categories)
    ? viewStat.categories
    : [];

  return {
    comicId,
    name,
    thumbUrl,
    status,
    comicUpdatedAt,
    categories,
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
  const latestReadAt = toIsoDateString(doc.lastReadAt, doc.updatedAt, doc.createdAt);
  const metadata = resolveHistoryMetadata(comicSlug, viewStat);

  return {
    _id: metadata.comicId || normalizeString(doc.comicId) || comicSlug,
    name: metadata.name,
    slug: comicSlug,
    origin_name: [],
    status: metadata.status,
    thumb_url: metadata.thumbUrl,
    sub_docquyen: false,
    category: metadata.categories,
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

export const getCurrentUserReadingHistory = async (): Promise<
  ReadingHistoryComic[]
> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    await connectToDatabase();
    const rows = (await ReadingProgressModel.find({
      userId,
      readChapters: { $exists: true },
    })
      .sort({ lastReadAt: -1, updatedAt: -1 })
      .select("comicId comicSlug readChapters lastReadChapter lastReadAt createdAt updatedAt")
      .lean()) as ReadingProgressDoc[];

    if (!rows.length) {
      return [];
    }

    const slugs = Array.from(
      new Set(rows.map((row) => normalizeString(row.comicSlug)).filter(Boolean)),
    );

    const viewStatRows = await MangaViewStatModel.find({
      comicSlug: { $in: slugs },
    })
      .select("comicId comicSlug comicName thumbUrl status comicUpdatedAt categories")
      .lean();

    const viewStatMap = new Map<string, MangaViewStatDoc>(
      viewStatRows.map((row: any) => [normalizeString(row.comicSlug), row]),
    );

    return rows
      .map((row) => {
        const slug = normalizeString(row.comicSlug);
        return toReadingHistoryComic(row, viewStatMap.get(slug));
      })
      .filter((item): item is ReadingHistoryComic => Boolean(item))
      .sort((a, b) => (a.latestReadAt < b.latestReadAt ? 1 : -1));
  } catch (error) {
    console.error("Failed to load reading history:", error);
    return [];
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

  revalidatePath(`/manga/${comicSlug}`);
  revalidatePath("/bookmarks");

  return { success: true };
};
