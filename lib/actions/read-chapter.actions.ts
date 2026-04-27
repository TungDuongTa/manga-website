"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { ReadChapterModel } from "@/database/models/read-chapter.model";
import { BookmarkModel } from "@/database/models/bookmark.model";
import { getComicDetail } from "@/lib/actions/otruyen-actions";
import { compareChapterNames } from "@/lib/chapter-utils";
import type { Category, OTruyenComic } from "@/types/otruyen-types";

type MarkChapterAsReadInput = {
  comicId?: string;
  comicSlug: string;
  comicName?: string;
  thumbUrl?: string;
  status?: string;
  comicUpdatedAt?: string;
  categories?: Category[];
  chapterName: string;
};

type MarkChapterAsReadResult = {
  success: boolean;
  requiresSignIn?: boolean;
};

export type ReadingHistoryComic = OTruyenComic & {
  latestReadAt: string;
  latestReadChapterName: string;
};

export type ReadingExpStats = {
  chaptersRead: number;
  totalExp: number;
  level: number;
  currentLevelExp: number;
  expToNextLevel: number;
  progressPercent: number;
  maxLevel: number;
};

const MAX_LEVEL = 100;
const EXP_PER_CHAPTER = 1;
const EXP_PER_LEVEL = 100;

const getCurrentUserId = async (): Promise<string | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user?.id ?? null;
};

const calculateReadingExpStats = (chaptersRead: number): ReadingExpStats => {
  const totalExp = Math.max(0, chaptersRead) * EXP_PER_CHAPTER;
  const rawLevel = Math.floor(totalExp / EXP_PER_LEVEL) + 1;
  const level = Math.min(MAX_LEVEL, rawLevel);

  if (level >= MAX_LEVEL) {
    return {
      chaptersRead,
      totalExp,
      level: MAX_LEVEL,
      currentLevelExp: EXP_PER_LEVEL,
      expToNextLevel: 0,
      progressPercent: 100,
      maxLevel: MAX_LEVEL,
    };
  }

  const currentLevelExp = totalExp % EXP_PER_LEVEL;
  const expToNextLevel = EXP_PER_LEVEL - currentLevelExp;
  const progressPercent = (currentLevelExp / EXP_PER_LEVEL) * 100;

  return {
    chaptersRead,
    totalExp,
    level,
    currentLevelExp,
    expToNextLevel,
    progressPercent,
    maxLevel: MAX_LEVEL,
  };
};

export const getCurrentUserReadingExpStats = async (): Promise<ReadingExpStats> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return calculateReadingExpStats(0);
  }

  await connectToDatabase();
  const chaptersRead = await ReadChapterModel.countDocuments({ userId });

  return calculateReadingExpStats(chaptersRead);
};


export const getReadChapterNames = async (
  comicSlug: string,
): Promise<string[]> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }

  await connectToDatabase();
  const rows = await ReadChapterModel.find({
    userId,
    comicSlug,
  })
    .sort({ readAt: -1 })
    .select("chapterName -_id")
    .lean();

  return rows.map((row: any) => row.chapterName).filter(Boolean);
};

export const getCurrentUserReadingHistory = async (): Promise<
  ReadingHistoryComic[]
> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }

  await connectToDatabase();
  const rows = await ReadChapterModel.find({ userId })
    .sort({ readAt: -1 })
    .lean();

  if (!rows.length) {
    return [];
  }

  const byComic = new Map<
    string,
    {
      comicId: string;
      comicSlug: string;
      comicName: string;
      thumbUrl: string;
      status: string;
      comicUpdatedAt: string;
      categories: Category[];
      latestReadAt: string;
      latestReadChapterName: string;
    }
  >();

  for (const row of rows as any[]) {
    if (!row.comicSlug || !row.chapterName) continue;

    const readAtIso = new Date(
      row.readAt || row.updatedAt || row.createdAt || Date.now(),
    ).toISOString();

    const existing = byComic.get(row.comicSlug);
    if (!existing) {
      byComic.set(row.comicSlug, {
        comicId: row.comicId || "",
        comicSlug: row.comicSlug,
        comicName: row.comicName || row.comicSlug,
        thumbUrl: row.thumbUrl || "",
        status: row.status || "ongoing",
        comicUpdatedAt: row.comicUpdatedAt || "",
        categories: Array.isArray(row.categories) ? row.categories : [],
        latestReadAt: readAtIso,
        latestReadChapterName: row.chapterName,
      });
      continue;
    }

    if (readAtIso > existing.latestReadAt) {
      existing.latestReadAt = readAtIso;
    }

    if (compareChapterNames(row.chapterName, existing.latestReadChapterName) > 0) {
      existing.latestReadChapterName = row.chapterName;
    }

    if (!existing.comicName && row.comicName)
      existing.comicName = row.comicName;
    if (!existing.thumbUrl && row.thumbUrl) existing.thumbUrl = row.thumbUrl;
    if (!existing.status && row.status) existing.status = row.status;
    if (!existing.comicUpdatedAt && row.comicUpdatedAt) {
      existing.comicUpdatedAt = row.comicUpdatedAt;
    }
    if (
      (!existing.categories || !existing.categories.length) &&
      row.categories
    ) {
      existing.categories = row.categories;
    }
  }

  const historyItems = Array.from(byComic.values());
  const missingMetadataSlugs = historyItems
    .filter(
      (item) =>
        !item.thumbUrl ||
        !item.comicName ||
        !item.status ||
        !item.categories?.length,
    )
    .map((item) => item.comicSlug);

  if (missingMetadataSlugs.length > 0) {
    const bookmarkRows = await BookmarkModel.find({
      userId,
      slug: { $in: missingMetadataSlugs },
    }).lean();

    const bookmarkMap = new Map<string, any>(
      bookmarkRows.map((row: any) => [row.slug, row]),
    );

    for (const item of historyItems) {
      const bookmark = bookmarkMap.get(item.comicSlug);
      if (!bookmark) continue;

      if (!item.thumbUrl && bookmark.thumbUrl)
        item.thumbUrl = bookmark.thumbUrl;
      if (!item.comicName && bookmark.name) item.comicName = bookmark.name;
      if (!item.status && bookmark.status) item.status = bookmark.status;
      if (!item.comicUpdatedAt && bookmark.comicUpdatedAt) {
        item.comicUpdatedAt = bookmark.comicUpdatedAt;
      }
      if (
        (!item.categories || !item.categories.length) &&
        bookmark.categories
      ) {
        item.categories = bookmark.categories;
      }
    }
  }

  const apiBackfillSlugs = historyItems
    .filter((item) => !item.thumbUrl)
    .map((item) => item.comicSlug);

  if (apiBackfillSlugs.length > 0) {
    const detailResults = await Promise.all(
      apiBackfillSlugs.map(async (slug) => {
        try {
          const detail = await getComicDetail(slug);
          return { slug, detail };
        } catch {
          return { slug, detail: null };
        }
      }),
    );

    await Promise.all(
      detailResults.map(async ({ slug, detail }) => {
        const item = detail?.item;
        if (!item) return;

        const target = historyItems.find(
          (history) => history.comicSlug === slug,
        );
        if (target) {
          target.comicId = item._id || target.comicId;
          target.comicName = item.name || target.comicName;
          target.thumbUrl = item.thumb_url || target.thumbUrl;
          target.status = item.status || target.status;
          target.comicUpdatedAt = item.updatedAt || target.comicUpdatedAt;
          target.categories = item.category || target.categories;
        }

        await ReadChapterModel.updateMany(
          { userId, comicSlug: slug },
          {
            $set: {
              comicId: item._id || "",
              comicName: item.name || "",
              thumbUrl: item.thumb_url || "",
              status: item.status || "",
              comicUpdatedAt: item.updatedAt || "",
              categories: (item.category || []).map((category) => ({
                id: category.id || "",
                name: category.name,
                slug: category.slug,
              })),
            },
          },
        );
      }),
    );
  }

  return historyItems
    .sort((a, b) => (a.latestReadAt < b.latestReadAt ? 1 : -1))
    .map((item) => ({
      _id: item.comicId || item.comicSlug,
      name: item.comicName || item.comicSlug,
      slug: item.comicSlug,
      origin_name: [],
      status: item.status || "ongoing",
      thumb_url: item.thumbUrl,
      sub_docquyen: false,
      category: Array.isArray(item.categories) ? item.categories : [],
      updatedAt: item.comicUpdatedAt || item.latestReadAt,
      chaptersLatest: item.latestReadChapterName
        ? [
            {
              filename: "",
              chapter_name: item.latestReadChapterName,
              chapter_title: "",
              chapter_api_data: "",
            },
          ]
        : [],
      latestReadAt: item.latestReadAt,
      latestReadChapterName: item.latestReadChapterName,
    }));
};

export const markChapterAsRead = async (
  input: MarkChapterAsReadInput,
): Promise<MarkChapterAsReadResult> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, requiresSignIn: true };
  }

  await connectToDatabase();

  await ReadChapterModel.updateOne(
    {
      userId,
      comicSlug: input.comicSlug,
      chapterName: input.chapterName,
    },
    {
      $set: {
        comicId: input.comicId || "",
        comicName: input.comicName || "",
        thumbUrl: input.thumbUrl || "",
        status: input.status || "",
        comicUpdatedAt: input.comicUpdatedAt || "",
        categories: (input.categories || []).map((category) => ({
          id: category.id || "",
          name: category.name,
          slug: category.slug,
        })),
        readAt: new Date(),
      },
    },
    { upsert: true },
  );

  revalidatePath(`/manga/${input.comicSlug}`);
  revalidatePath("/bookmarks");

  return { success: true };
};
