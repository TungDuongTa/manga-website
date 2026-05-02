import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChapterReaderPageClient } from "@/components/chapter-reader-page-client";
import { isMangaBookmarked } from "@/lib/actions/bookmark.actions";
import { getComicDetail, getChapterData } from "@/lib/actions/otruyen-actions";
import { getReadingProgressChapterNames } from "@/lib/actions/reading-progress.actions";
import { withSiteSuffix } from "@/lib/seo";

type ChapterReaderPageProps = {
  params: Promise<{ id: string; chapter: string }>;
};

const getComicDetailCached = cache(async (slug: string) => getComicDetail(slug));

export async function generateMetadata({
  params,
}: ChapterReaderPageProps): Promise<Metadata> {
  const { id, chapter } = await params;
  const detailData = await getComicDetailCached(id);
  const comic = detailData?.item;
  const comicSlug = comic?.slug || id;
  const canonicalPath = `/manga/${comicSlug}/chapter/${chapter}`;

  if (!comic) {
    return {
      title: `Chapter ${chapter} Not Found`,
      description: "The chapter you requested could not be found.",
      alternates: {
        canonical: canonicalPath,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = `${comic.name} Chapter ${chapter}`;
  const description = `Read ${comic.name} chapter ${chapter} online with high-quality pages and smooth chapter navigation.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: withSiteSuffix(title),
      description,
      type: "article",
      url: canonicalPath,
    },
    twitter: {
      title: withSiteSuffix(title),
      description,
    },
  };
}

export default async function ChapterReaderPage({
  params,
}: ChapterReaderPageProps) {
  const { id, chapter } = await params;

  const [detailResult, bookmarkResult, readResult] = await Promise.allSettled([
    getComicDetailCached(id),
    isMangaBookmarked(id),
    getReadingProgressChapterNames(id),
  ]);

  const detailData =
    detailResult.status === "fulfilled" ? detailResult.value : null;
  const initialBookmarked =
    bookmarkResult.status === "fulfilled" ? bookmarkResult.value : false;
  const initialReadChapterNames =
    readResult.status === "fulfilled" ? readResult.value : [];
  if (!detailData?.item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          Chapter Not Found
        </h1>
        <Link href={`/manga/${id}`}>
          <Button>Go Back</Button>
        </Link>
      </div>
    );
  }

  const comic = detailData.item;
  const allChapters = comic.chapters?.[0]?.server_data || [];
  const currentChapterData = allChapters.find(
    (c) => c.chapter_name === chapter,
  );

  if (!currentChapterData?.chapter_api_data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          Chapter Not Found
        </h1>
        <Link href={`/manga/${comic.slug || id}`}>
          <Button>Go Back</Button>
        </Link>
      </div>
    );
  }

  const chapterContent = await getChapterData(
    currentChapterData.chapter_api_data,
  );
  const chapterImages = chapterContent?.item?.chapter_image || [];
  const chapterPath = chapterContent?.item?.chapter_path || "";

  if (chapterImages.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          Chapter Not Found
        </h1>
        <Link href={`/manga/${comic.slug || id}`}>
          <Button>Go Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <ChapterReaderPageClient
      id={id}
      chapter={chapter}
      comic={comic}
      chapterImages={chapterImages}
      chapterPath={chapterPath}
      initialBookmarked={initialBookmarked}
      initialReadChapterNames={initialReadChapterNames}
    />
  );
}
