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
  latestChapterName?: string | null;
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

const toRankingItem = (
  doc: any,
  periodViews: number,
  latestChapterMap?: Map<string, string>,
): MangaRankingItem => {
  const totalViews = Number(doc.totalViews || 0);
  const comicSlug = String(doc.comicSlug || "");

  return {
    _id: doc.comicId || comicSlug,
    name: doc.comicName || comicSlug,
    slug: comicSlug,
    origin_name: [],
    status: doc.status || "ongoing",
    thumb_url: doc.thumbUrl || "",
    sub_docquyen: false,
    category: Array.isArray(doc.categories) ? doc.categories : [],
    updatedAt:
      doc.comicUpdatedAt ||
      new Date(doc.updatedAt || doc.createdAt || Date.now()).toISOString(),
    chaptersLatest: [],
    latestChapterName: latestChapterMap?.get(comicSlug) || null,
    totalViews,
    periodViews: Number(periodViews || 0),
  };
};

const toPeriodRows = (rows: any[] = []): PeriodRankingRow[] =>
  rows
    .map((row) => ({
      _id: String(row?._id || "").trim(),
      periodViews: Number(row?.periodViews || 0),
    }))
    .filter((row) => Boolean(row._id) && row.periodViews > 0);

const getWindowRankings = async (
  limit: number,
): Promise<{
  daily: PeriodRankingRow[];
  weekly: PeriodRankingRow[];
  monthly: PeriodRankingRow[];
}> => {
  const now = Date.now();
  const dailySince = new Date(now - ONE_DAY_MS);
  const weeklySince = new Date(now - ONE_WEEK_MS);
  const monthlySince = new Date(now - THIRTY_DAYS_MS);

  const [result] = await MangaViewModel.aggregate([
    {
      $match: {
        viewedAt: { $gte: monthlySince },
      },
    },
    {
      $project: {
        comicSlug: 1,
        viewedAt: 1,
      },
    },
    {
      $group: {
        _id: "$comicSlug",
        dailyViews: {
          $sum: {
            $cond: [{ $gte: ["$viewedAt", dailySince] }, 1, 0],
          },
        },
        weeklyViews: {
          $sum: {
            $cond: [{ $gte: ["$viewedAt", weeklySince] }, 1, 0],
          },
        },
        monthlyViews: { $sum: 1 },
        lastViewedAt: { $max: "$viewedAt" },
      },
    },
    {
      $facet: {
        daily: [
          { $match: { dailyViews: { $gt: 0 } } },
          { $sort: { dailyViews: -1, lastViewedAt: -1 } },
          { $limit: limit },
          { $project: { _id: 1, periodViews: "$dailyViews" } },
        ],
        weekly: [
          { $match: { weeklyViews: { $gt: 0 } } },
          { $sort: { weeklyViews: -1, lastViewedAt: -1 } },
          { $limit: limit },
          { $project: { _id: 1, periodViews: "$weeklyViews" } },
        ],
        monthly: [
          { $match: { monthlyViews: { $gt: 0 } } },
          { $sort: { monthlyViews: -1, lastViewedAt: -1 } },
          { $limit: limit },
          { $project: { _id: 1, periodViews: "$monthlyViews" } },
        ],
      },
    },
  ]);

  return {
    daily: toPeriodRows(result?.daily),
    weekly: toPeriodRows(result?.weekly),
    monthly: toPeriodRows(result?.monthly),
  };
};

const buildPeriodRanking = (
  rows: PeriodRankingRow[],
  statMap: Map<string, any>,
  latestChapterMap: Map<string, string>,
): MangaRankingItem[] =>
  rows
    .map((row) => {
      const stat = statMap.get(row._id);
      if (!stat) return null;
      return toRankingItem(stat, row.periodViews, latestChapterMap);
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

    const [windowRankings, allTimeRows] = await Promise.all([
      getWindowRankings(safeLimit),
      MangaViewStatModel.find({ totalViews: { $gt: 0 } })
        .sort({ totalViews: -1, lastViewedAt: -1 })
        .limit(safeLimit)
        .lean(),
    ]);
    const { daily: dailyRows, weekly: weeklyRows, monthly: monthlyRows } =
      windowRankings;

    const periodSlugs = Array.from(
      new Set(
        [...dailyRows, ...weeklyRows, ...monthlyRows].map((row) => row._id),
      ),
    );
    const allTimeSlugs = allTimeRows.map((row: any) =>
      String(row.comicSlug || "").trim(),
    );
    const rankingSlugs = Array.from(
      new Set([...periodSlugs, ...allTimeSlugs].filter(Boolean)),
    );

    const statDocs =
      periodSlugs.length > 0
        ? await MangaViewStatModel.find({ comicSlug: { $in: periodSlugs } }).lean()
        : [];
    const statMap = new Map<string, any>(
      statDocs.map((doc: any) => [String(doc.comicSlug), doc]),
    );
    const latestChapterRows =
      rankingSlugs.length > 0
        ? await MangaViewModel.aggregate([
            {
              $match: {
                comicSlug: { $in: rankingSlugs },
                chapterName: { $nin: ["", null] },
              },
            },
            { $sort: { viewedAt: -1 } },
            {
              $group: {
                _id: "$comicSlug",
                latestChapterName: { $first: "$chapterName" },
              },
            },
          ])
        : [];
    const latestChapterMap = new Map<string, string>(
      latestChapterRows.map((row: any) => [
        String(row._id || ""),
        String(row.latestChapterName || ""),
      ]),
    );

    return {
      daily: buildPeriodRanking(dailyRows, statMap, latestChapterMap),
      weekly: buildPeriodRanking(weeklyRows, statMap, latestChapterMap),
      monthly: buildPeriodRanking(monthlyRows, statMap, latestChapterMap),
      allTime: allTimeRows.map((row: any) =>
        toRankingItem(row, Number(row.totalViews || 0), latestChapterMap),
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
