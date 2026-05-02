import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/database/mongoose";
import { getManga18ListPage } from "@/lib/actions/manga18.actions";
import { getMangaRankings } from "@/lib/actions/manga-view.actions";
import { getHomeData, getListByType } from "@/lib/actions/otruyen-actions";
import { toAbsoluteUrl } from "@/lib/seo";

type Manga18Row = {
  slug?: unknown;
  updatedAt?: unknown;
  lastCrawledAt?: unknown;
  createdAt?: unknown;
};

const toValidDate = (...values: unknown[]): Date => {
  for (const value of values) {
    if (!value) continue;
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
};

const normalizeSlug = (value: unknown): string => String(value || "").trim();

const getPublicMangaSlugs = async (): Promise<string[]> => {
  const slugSet = new Set<string>();

  try {
    const [homeData, latestData, completedData, ongoingData, rankingData] =
      await Promise.all([
        getHomeData(),
        getListByType("truyen-moi", 1),
        getListByType("hoan-thanh", 1),
        getListByType("dang-phat-hanh", 1),
        getMangaRankings(120),
      ]);

    const addItems = (items: Array<{ slug?: string }> = []) => {
      for (const item of items) {
        const slug = normalizeSlug(item.slug);
        if (slug) slugSet.add(slug);
      }
    };

    addItems(homeData?.items || []);
    addItems(latestData?.items || []);
    addItems(completedData?.items || []);
    addItems(ongoingData?.items || []);
    addItems(rankingData.daily || []);
    addItems(rankingData.weekly || []);
    addItems(rankingData.monthly || []);
    addItems(rankingData.allTime || []);
  } catch (error) {
    console.error("Failed to build public manga sitemap entries:", error);
  }

  return Array.from(slugSet);
};

const getManga18Rows = async (): Promise<Manga18Row[]> => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return [];

    return db
      .collection<Manga18Row>("mangas18")
      .find({})
      .project({
        slug: 1,
        updatedAt: 1,
        lastCrawledAt: 1,
        createdAt: 1,
      })
      .toArray();
  } catch (error) {
    console.error("Failed to load 18+ sitemap entries:", error);
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [publicMangaSlugs, manga18Rows, manga18List] = await Promise.all([
    getPublicMangaSlugs(),
    getManga18Rows(),
    getManga18ListPage({ page: 1, pageSize: 1 }),
  ]);

  const total18Pages = Math.max(
    1,
    Math.ceil(
      manga18List.pagination.totalItems / manga18List.pagination.totalItemsPerPage,
    ),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl("/"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: toAbsoluteUrl("/browse"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl("/latest"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl("/ranking"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/18+"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  const paginated18Routes: MetadataRoute.Sitemap = Array.from(
    { length: total18Pages },
    (_, index) => {
      const pageNumber = index + 1;
      const pagePath = pageNumber === 1 ? "/18+" : `/18+?page=${pageNumber}`;
      return {
        url: toAbsoluteUrl(pagePath),
        lastModified: now,
        changeFrequency: "daily",
        priority: pageNumber === 1 ? 0.7 : 0.6,
      };
    },
  );

  const mangaRoutes: MetadataRoute.Sitemap = publicMangaSlugs.map((slug) => ({
    url: toAbsoluteUrl(`/manga/${slug}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const manga18Routes: MetadataRoute.Sitemap = manga18Rows.flatMap((row) => {
    const slug = normalizeSlug(row.slug);
    if (!slug) return [];

    return [
      {
        url: toAbsoluteUrl(`/18+/${slug}`),
        lastModified: toValidDate(
          row.lastCrawledAt,
          row.updatedAt,
          row.createdAt,
          now,
        ),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
    ];
  });

  return [...staticRoutes, ...paginated18Routes, ...mangaRoutes, ...manga18Routes];
}
