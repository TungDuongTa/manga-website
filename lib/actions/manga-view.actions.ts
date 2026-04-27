"use server";

import { connectToDatabase } from "@/database/mongoose";
import { MangaViewModel } from "@/database/models/manga-view.model";
import { MangaViewStatModel } from "@/database/models/manga-view-stat.model";
import type { Category, OTruyenComic } from "@/types/otruyen-types";

type TrackMangaChapterViewInput = {
  comicId?: string;
  comicSlug: string;
  comicName?: string;
  thumbUrl?: string;
  status?: string;
  comicUpdatedAt?: string;
  categories?: Category[];
  chapterName: string;
};

type TrackMangaChapterViewResult = {
  success: boolean;
};

export type MangaViewStats = {
  comicSlug: string;
  totalViews: number;
  lastViewedAt: string | null;
};

export type MangaRankingPeriod = "daily" | "weekly" | "monthly" | "allTime";

export type MangaRankingItem = OTruyenComic & {
  periodViews: number;
  totalViews: number;
};

export type MangaRankings = {
  daily: MangaRankingItem[];
  weekly: MangaRankingItem[];
  monthly: MangaRankingItem[];
  allTime: MangaRankingItem[];
};

type PeriodRankingRow = {
  _id: string;
  periodViews: number;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;
const DEFAULT_RANKING_LIMIT = 10;
const MAX_RANKING_LIMIT = 120;

const toStoredCategories = (categories: Category[] = []) =>
  categories.map((category) => ({
    id: category.id || "",
    name: category.name,
    slug: category.slug,
  }));

const toRankingItem = (doc: any, periodViews: number): MangaRankingItem => {
  const totalViews = Number(doc.totalViews || 0);

  return {
    _id: doc.comicId || doc.comicSlug,
    name: doc.comicName || doc.comicSlug,
    slug: doc.comicSlug,
    origin_name: [],
    status: doc.status || "ongoing",
    thumb_url: doc.thumbUrl || "",
    sub_docquyen: false,
    category: Array.isArray(doc.categories) ? doc.categories : [],
    updatedAt:
      doc.comicUpdatedAt ||
      new Date(doc.updatedAt || doc.createdAt || Date.now()).toISOString(),
    chaptersLatest: [],
    totalViews,
    periodViews: Number(periodViews || 0),
  };
};

const getSinceDate = (period: "daily" | "weekly" | "monthly"): Date => {
  const now = Date.now();

  switch (period) {
    case "daily":
      return new Date(now - ONE_DAY_MS);
    case "weekly":
      return new Date(now - ONE_WEEK_MS);
    case "monthly":
      return new Date(now - THIRTY_DAYS_MS);
    default:
      return new Date(now - ONE_DAY_MS);
  }
};

const getPeriodRanking = async (
  sinceDate: Date,
  limit: number,
): Promise<PeriodRankingRow[]> => {
  const rows = await MangaViewModel.aggregate([
    {
      $match: {
        viewedAt: { $gte: sinceDate },
      },
    },
    {
      $group: {
        _id: "$comicSlug",
        periodViews: { $sum: 1 },
        lastViewedAt: { $max: "$viewedAt" },
      },
    },
    {
      $sort: {
        periodViews: -1,
        lastViewedAt: -1,
      },
    },
    {
      $limit: limit,
    },
  ]);

  return rows.map((row: any) => ({
    _id: String(row._id || ""),
    periodViews: Number(row.periodViews || 0),
  }));
};

const buildPeriodRanking = (
  rows: PeriodRankingRow[],
  statMap: Map<string, any>,
): MangaRankingItem[] =>
  rows
    .map((row) => {
      const stat = statMap.get(row._id);
      if (!stat) return null;
      return toRankingItem(stat, row.periodViews);
    })
    .filter((item): item is MangaRankingItem => Boolean(item));

export const trackMangaChapterView = async (
  input: TrackMangaChapterViewInput,
): Promise<TrackMangaChapterViewResult> => {
  const comicSlug = input.comicSlug?.trim();
  const chapterName = input.chapterName?.trim();

  if (!comicSlug || !chapterName) {
    return { success: false };
  }

  try {
    await connectToDatabase();

    const now = new Date();
    const categories = toStoredCategories(input.categories || []);
    const metadata = {
      comicId: input.comicId || "",
      comicSlug,
      comicName: input.comicName || "",
      thumbUrl: input.thumbUrl || "",
      status: input.status || "",
      comicUpdatedAt: input.comicUpdatedAt || "",
      categories,
    };

    await Promise.all([
      MangaViewModel.create({
        ...metadata,
        chapterName,
        viewedAt: now,
      }),
      MangaViewStatModel.updateOne(
        { comicSlug },
        {
          $set: metadata,
          $inc: { totalViews: 1 },
          $max: { lastViewedAt: now },
        },
        { upsert: true },
      ),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Failed to track manga view:", error);
    return { success: false };
  }
};

export const getMangaViewStats = async (
  comicSlug: string,
): Promise<MangaViewStats> => {
  const normalizedSlug = comicSlug.trim();
  if (!normalizedSlug) {
    return { comicSlug: "", totalViews: 0, lastViewedAt: null };
  }

  try {
    await connectToDatabase();
    const doc = await MangaViewStatModel.findOne({ comicSlug: normalizedSlug })
      .select("comicSlug totalViews lastViewedAt")
      .lean();

    if (!doc) {
      return {
        comicSlug: normalizedSlug,
        totalViews: 0,
        lastViewedAt: null,
      };
    }

    return {
      comicSlug: doc.comicSlug || normalizedSlug,
      totalViews: Number(doc.totalViews || 0),
      lastViewedAt: doc.lastViewedAt
        ? new Date(doc.lastViewedAt).toISOString()
        : null,
    };
  } catch (error) {
    console.error("Failed to load manga view stats:", error);
    return {
      comicSlug: normalizedSlug,
      totalViews: 0,
      lastViewedAt: null,
    };
  }
};

export const getMangaRankings = async (
  limit: number = DEFAULT_RANKING_LIMIT,
): Promise<MangaRankings> => {
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(MAX_RANKING_LIMIT, Math.floor(limit)))
    : DEFAULT_RANKING_LIMIT;

  try {
    await connectToDatabase();

    const [dailyRows, weeklyRows, monthlyRows, allTimeRows] = await Promise.all([
      getPeriodRanking(getSinceDate("daily"), safeLimit),
      getPeriodRanking(getSinceDate("weekly"), safeLimit),
      getPeriodRanking(getSinceDate("monthly"), safeLimit),
      MangaViewStatModel.find({ totalViews: { $gt: 0 } })
        .sort({ totalViews: -1, lastViewedAt: -1 })
        .limit(safeLimit)
        .lean(),
    ]);

    const slugs = Array.from(
      new Set(
        [...dailyRows, ...weeklyRows, ...monthlyRows].map((row) => row._id),
      ),
    );

    const statDocs =
      slugs.length > 0
        ? await MangaViewStatModel.find({ comicSlug: { $in: slugs } }).lean()
        : [];
    const statMap = new Map<string, any>(
      statDocs.map((doc: any) => [String(doc.comicSlug), doc]),
    );

    return {
      daily: buildPeriodRanking(dailyRows, statMap),
      weekly: buildPeriodRanking(weeklyRows, statMap),
      monthly: buildPeriodRanking(monthlyRows, statMap),
      allTime: allTimeRows.map((row: any) =>
        toRankingItem(row, Number(row.totalViews || 0)),
      ),
    };
  } catch (error) {
    console.error("Failed to load manga rankings:", error);
    return {
      daily: [],
      weekly: [],
      monthly: [],
      allTime: [],
    };
  }
};
