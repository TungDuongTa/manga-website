"use server";

import { connectToDatabase } from "@/database/mongoose";
import { normalizePageAndSize } from "@/lib/pagination";
import type {
  Category,
  ChapterData,
  ChapterImage,
  ComicDetailItem,
  OTruyenComic,
  Pagination,
} from "@/types/otruyen-types";

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

type DateLike =
  | Date
  | string
  | number
  | null
  | undefined
  | { $date?: Date | string | number };

type Manga18Doc = {
  _id?: unknown;
  slug?: unknown;
  title?: unknown;
  alternativeTitles?: unknown;
  author?: unknown;
  chapterUrls?: unknown;
  coverCloudinaryUrl?: unknown;
  coverUrl?: unknown;
  description?: unknown;
  tags?: unknown;
  totalChapters?: unknown;
  lastCrawledAt?: DateLike;
  updatedAt?: DateLike;
  createdAt?: DateLike;
};

type Chapter18PageDoc = {
  index?: unknown;
  cloudinaryUrl?: unknown;
  originalUrl?: unknown;
};

type Chapter18Doc = {
  _id?: unknown;
  mangaSlug?: unknown;
  chapterNumber?: unknown;
  sourceUrl?: unknown;
  title?: unknown;
  pages?: unknown;
};

type ChapterCandidate = {
  chapterName: string;
  chapterNumber: number | null;
  chapter_api_data: string;
  chapter_title: string;
};

export type Manga18ChapterContent = {
  chapterName: string;
  chapterImages: ChapterImage[];
};

export type Manga18ListPageResult = {
  items: OTruyenComic[];
  pagination: Pagination;
};

const cleanString = (value: unknown): string => String(value ?? "").trim();

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanString(item)).filter(Boolean);
};

const toIsoDateString = (...values: DateLike[]): string => {
  for (const value of values) {
    if (!value) continue;

    const unwrapped: unknown =
      typeof value === "object" && value !== null && "$date" in value
        ? value.$date
        : value;
    if (!unwrapped) continue;

    if (
      unwrapped instanceof Date ||
      typeof unwrapped === "string" ||
      typeof unwrapped === "number"
    ) {
      const parsed = new Date(unwrapped);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
  }

  return new Date().toISOString();
};

const stripTrailingZeroes = (value: string): string =>
  value.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

const parseChapterNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = cleanString(value)
    .replace(/^chapter[\s\-_]*/i, "")
    .trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeChapterName = (value: unknown): string => {
  const chapterNumber = parseChapterNumber(value);
  if (chapterNumber !== null) {
    return stripTrailingZeroes(String(chapterNumber));
  }

  return cleanString(value)
    .replace(/^chapter[\s\-_]*/i, "")
    .trim();
};

const extractChapterFromUrl = (url: string): string => {
  const normalizedUrl = cleanString(url);
  if (!normalizedUrl) return "";

  const chapterMatch = normalizedUrl.match(/chapter[\s\-_]*([0-9]+(?:\.[0-9]+)?)/i);
  if (chapterMatch?.[1]) {
    return normalizeChapterName(chapterMatch[1]);
  }

  const segments = normalizedUrl.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "";
  return normalizeChapterName(lastSegment);
};

const getLatestChapterNameFromUrls = (
  chapterUrls: string[],
  fallbackTotalChapters: unknown,
): string => {
  const candidates = chapterUrls
    .map((url, index) => {
      const extracted = extractChapterFromUrl(url);
      if (!extracted) return null;
      return {
        index,
        chapterName: extracted,
        chapterNumber: parseChapterNumber(extracted),
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> =>
      Boolean(candidate),
    );

  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      if (a.chapterNumber !== null && b.chapterNumber !== null) {
        if (a.chapterNumber === b.chapterNumber) return a.index - b.index;
        return a.chapterNumber - b.chapterNumber;
      }

      if (a.chapterNumber !== null) return 1;
      if (b.chapterNumber !== null) return -1;
      return a.index - b.index;
    });

    return candidates[candidates.length - 1].chapterName;
  }

  const fallbackNumber = parseChapterNumber(fallbackTotalChapters);
  if (fallbackNumber !== null) {
    return normalizeChapterName(fallbackNumber);
  }

  return "";
};

const toCategorySlug = (tag: string): string => {
  const normalized = tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "tag";
};

const toCategories = (tagsValue: unknown): Category[] => {
  const tags = normalizeStringArray(tagsValue);
  return tags.map((tag) => {
    const slug = toCategorySlug(tag);
    return {
      id: slug,
      name: tag,
      slug,
    };
  });
};

const toAuthorList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return normalizeStringArray(value);
  }

  const raw = cleanString(value);
  if (!raw) return [];

  return raw
    .split(/[,;/|]/g)
    .map((entry) => cleanString(entry))
    .filter(Boolean);
};

const compareChapterCandidates = (a: ChapterCandidate, b: ChapterCandidate) => {
  if (a.chapterNumber !== null && b.chapterNumber !== null) {
    if (a.chapterNumber === b.chapterNumber) {
      return a.chapterName.localeCompare(b.chapterName, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }
    return a.chapterNumber - b.chapterNumber;
  }

  if (a.chapterNumber !== null) return -1;
  if (b.chapterNumber !== null) return 1;
  return a.chapterName.localeCompare(b.chapterName, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const toChapterCandidatesFromDocs = (chapterDocs: Chapter18Doc[]): ChapterCandidate[] => {
  return chapterDocs
    .map((doc) => {
      const chapterName = normalizeChapterName(doc.chapterNumber);
      if (!chapterName) return null;

      return {
        chapterName,
        chapterNumber: parseChapterNumber(chapterName),
        chapter_api_data: chapterName,
        chapter_title: cleanString(doc.title),
      } satisfies ChapterCandidate;
    })
    .filter((candidate): candidate is ChapterCandidate => Boolean(candidate));
};

const toChapterCandidatesFromUrls = (chapterUrls: string[]): ChapterCandidate[] => {
  return chapterUrls
    .map((url) => {
      const chapterName = extractChapterFromUrl(url);
      if (!chapterName) return null;

      return {
        chapterName,
        chapterNumber: parseChapterNumber(chapterName),
        chapter_api_data: chapterName,
        chapter_title: "",
      } satisfies ChapterCandidate;
    })
    .filter((candidate): candidate is ChapterCandidate => Boolean(candidate));
};

const toChapterCandidatesFromTotal = (
  totalChaptersValue: unknown,
): ChapterCandidate[] => {
  const totalChapters = Number.parseInt(cleanString(totalChaptersValue), 10);
  if (!Number.isFinite(totalChapters) || totalChapters <= 0) return [];

  return Array.from({ length: totalChapters }, (_, index) => {
    const chapterName = String(index + 1);
    return {
      chapterName,
      chapterNumber: index + 1,
      chapter_api_data: chapterName,
      chapter_title: "",
    } satisfies ChapterCandidate;
  });
};

const mergeChapterCandidates = (
  primary: ChapterCandidate[],
  fallback: ChapterCandidate[],
): ChapterData[] => {
  const map = new Map<string, ChapterCandidate>();

  for (const candidate of fallback) {
    map.set(candidate.chapterName, candidate);
  }

  for (const candidate of primary) {
    map.set(candidate.chapterName, candidate);
  }

  return Array.from(map.values())
    .sort(compareChapterCandidates)
    .map((candidate) => ({
      filename: "",
      chapter_name: candidate.chapterName,
      chapter_title: candidate.chapter_title,
      chapter_api_data: candidate.chapter_api_data,
    }));
};

const toMangaCardItem = (doc: Manga18Doc): OTruyenComic => {
  const slug = cleanString(doc.slug);
  const chapterUrls = normalizeStringArray(doc.chapterUrls);
  const latestChapterName = getLatestChapterNameFromUrls(
    chapterUrls,
    doc.totalChapters,
  );
  const thumbUrl = cleanString(doc.coverCloudinaryUrl) || cleanString(doc.coverUrl);

  return {
    _id: cleanString(doc._id) || slug,
    name: cleanString(doc.title) || slug,
    slug,
    origin_name: normalizeStringArray(doc.alternativeTitles),
    status: "ongoing",
    thumb_url: thumbUrl,
    sub_docquyen: false,
    category: toCategories(doc.tags),
    updatedAt: toIsoDateString(doc.lastCrawledAt, doc.updatedAt, doc.createdAt),
    chaptersLatest: latestChapterName
      ? [
          {
            filename: "",
            chapter_name: latestChapterName,
            chapter_title: "",
            chapter_api_data: latestChapterName,
          },
        ]
      : [],
  };
};

const getChapterNameFromChapterDoc = (doc: Chapter18Doc): string => {
  const fromNumber = normalizeChapterName(doc.chapterNumber);
  if (fromNumber) return fromNumber;

  const fromSource = extractChapterFromUrl(cleanString(doc.sourceUrl));
  return fromSource;
};

const getDatabase = async () => {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection is not ready.");
  }

  return db;
};

export const getManga18ListPage = async ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<Manga18ListPageResult> => {
  try {
    const normalized = normalizePageAndSize(
      page,
      pageSize,
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const db = await getDatabase();
    const mangasCollection = db.collection<Manga18Doc>("mangas18");

    const totalItems = await mangasCollection.countDocuments({});
    const totalPages = Math.max(1, Math.ceil(totalItems / normalized.pageSize));
    const safePage = Math.min(normalized.page, totalPages);
    const skip = (safePage - 1) * normalized.pageSize;

    const docs = await mangasCollection
      .find({})
      .sort({ lastCrawledAt: -1, updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(normalized.pageSize)
      .toArray();

    return {
      items: docs.map(toMangaCardItem).filter((item) => Boolean(item.slug)),
      pagination: {
        totalItems,
        totalItemsPerPage: normalized.pageSize,
        currentPage: safePage,
        pageRanges: totalPages,
      },
    };
  } catch (error) {
    console.error("Failed to fetch 18+ manga list:", error);
    return {
      items: [],
      pagination: {
        totalItems: 0,
        totalItemsPerPage: DEFAULT_PAGE_SIZE,
        currentPage: 1,
        pageRanges: 1,
      },
    };
  }
};

export const getManga18Detail = async (
  slug: string,
): Promise<ComicDetailItem | null> => {
  const normalizedSlug = cleanString(slug);
  if (!normalizedSlug) return null;

  try {
    const db = await getDatabase();
    const mangasCollection = db.collection<Manga18Doc>("mangas18");
    const chaptersCollection = db.collection<Chapter18Doc>("chapters18");

    const [mangaDoc, chapterDocs] = await Promise.all([
      mangasCollection.findOne({ slug: normalizedSlug }),
      chaptersCollection
        .find({ mangaSlug: normalizedSlug })
        .sort({ chapterNumber: 1 })
        .toArray(),
    ]);

    if (!mangaDoc) {
      return null;
    }

    const chapterUrls = normalizeStringArray(mangaDoc.chapterUrls);
    const chapterCandidatesFromDocs = toChapterCandidatesFromDocs(chapterDocs);
    const chapterCandidatesFromUrls = toChapterCandidatesFromUrls(chapterUrls);
    const chapterCandidatesFromTotal = toChapterCandidatesFromTotal(
      mangaDoc.totalChapters,
    );
    const serverData = mergeChapterCandidates(
      chapterCandidatesFromDocs,
      [...chapterCandidatesFromTotal, ...chapterCandidatesFromUrls],
    );

    return {
      _id: cleanString(mangaDoc._id) || normalizedSlug,
      name: cleanString(mangaDoc.title) || normalizedSlug,
      slug: normalizedSlug,
      origin_name: normalizeStringArray(mangaDoc.alternativeTitles),
      content: cleanString(mangaDoc.description).replace(/\r?\n/g, "<br/>"),
      status: "ongoing",
      thumb_url:
        cleanString(mangaDoc.coverCloudinaryUrl) || cleanString(mangaDoc.coverUrl),
      sub_docquyen: false,
      author: toAuthorList(mangaDoc.author),
      category: toCategories(mangaDoc.tags),
      chapters: [
        {
          server_name: "Cloudinary",
          server_data: serverData,
        },
      ],
      updatedAt: toIsoDateString(
        mangaDoc.lastCrawledAt,
        mangaDoc.updatedAt,
        mangaDoc.createdAt,
      ),
    };
  } catch (error) {
    console.error("Failed to fetch 18+ manga detail:", error);
    return null;
  }
};

export const getManga18ChapterContent = async ({
  mangaSlug,
  chapter,
}: {
  mangaSlug: string;
  chapter: string;
}): Promise<Manga18ChapterContent | null> => {
  const normalizedSlug = cleanString(mangaSlug);
  const normalizedChapter = normalizeChapterName(chapter);
  if (!normalizedSlug || !normalizedChapter) return null;

  try {
    const db = await getDatabase();
    const chaptersCollection = db.collection<Chapter18Doc>("chapters18");
    const chapterDocs = await chaptersCollection
      .find({ mangaSlug: normalizedSlug })
      .toArray();

    const chapterDoc = chapterDocs.find(
      (doc) => getChapterNameFromChapterDoc(doc) === normalizedChapter,
    );
    if (!chapterDoc) return null;

    const pages = Array.isArray(chapterDoc.pages)
      ? (chapterDoc.pages as Chapter18PageDoc[])
      : [];

    const chapterImages = pages
      .map((page, index) => {
        const imageFile =
          cleanString(page.cloudinaryUrl) || cleanString(page.originalUrl);
        if (!imageFile) return null;

        const parsedIndex = Number.parseInt(cleanString(page.index), 10);
        const imagePage =
          Number.isFinite(parsedIndex) && parsedIndex > 0
            ? parsedIndex
            : index + 1;

        return {
          image_page: imagePage,
          image_file: imageFile,
        } satisfies ChapterImage;
      })
      .filter((page): page is ChapterImage => Boolean(page))
      .sort((a, b) => a.image_page - b.image_page);

    if (chapterImages.length === 0) {
      return null;
    }

    return {
      chapterName: normalizedChapter,
      chapterImages,
    };
  } catch (error) {
    console.error("Failed to fetch 18+ chapter content:", error);
    return null;
  }
};
