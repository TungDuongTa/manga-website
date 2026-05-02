import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MangaDetailPageClient } from "@/components/manga-detail-page-client";
import { isMangaBookmarked } from "@/lib/actions/bookmark.actions";
import { getMangaViewStats } from "@/lib/actions/manga-view.actions";
import { getComicDetail } from "@/lib/actions/otruyen-actions";
import { getReadingProgressChapterNames } from "@/lib/actions/reading-progress.actions";
import {
  stripHtml,
  truncateText,
  withSiteSuffix,
} from "@/lib/seo";
import { getImageUrl } from "@/types/otruyen-types";

type MangaDetailPageProps = {
  params: Promise<{ id: string }>;
};

const getComicDetailCached = cache(async (slug: string) => getComicDetail(slug));

export async function generateMetadata({
  params,
}: MangaDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const detailData = await getComicDetailCached(id);
  const comic = detailData?.item;
  const canonicalPath = `/manga/${comic?.slug || id}`;

  if (!comic) {
    return {
      title: "Manga Not Found",
      description: "The manga you requested could not be found.",
      alternates: {
        canonical: canonicalPath,
      },
    };
  }

  const fallbackDescription = `Read ${comic.name} online with chapter updates, reading progress, and community features.`;
  const description = truncateText(
    stripHtml(comic.content || "") || fallbackDescription,
    160,
  );
  const title = `${comic.name} Manga`;
  const coverImage = comic.thumb_url?.trim() ? getImageUrl(comic.thumb_url) : "";

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
      images: coverImage
        ? [
            {
              url: coverImage,
              alt: comic.name,
            },
          ]
        : undefined,
    },
    twitter: {
      title: withSiteSuffix(title),
      description,
      images: coverImage ? [coverImage] : undefined,
    },
  };
}

export default async function MangaDetailPage({
  params,
}: MangaDetailPageProps) {
  const { id } = await params;

  const [detailResult, bookmarkResult, readResult, viewResult] =
    await Promise.allSettled([
      getComicDetailCached(id),
      isMangaBookmarked(id),
      getReadingProgressChapterNames(id),
      getMangaViewStats(id),
    ]);

  const detailData =
    detailResult.status === "fulfilled" ? detailResult.value : null;

  if (!detailData?.item) {
    return (
      <div className="min-h-screen">
        <main className="flex min-h-[60vh] flex-col items-center justify-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Manga Not Found
          </h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </main>
      </div>
    );
  }

  const initialBookmarked =
    bookmarkResult.status === "fulfilled" ? bookmarkResult.value : false;
  const initialReadChapterNames =
    readResult.status === "fulfilled" ? readResult.value : [];
  const initialTotalViews =
    viewResult.status === "fulfilled" ? viewResult.value.totalViews : 0;

  return (
    <MangaDetailPageClient
      id={id}
      comic={detailData.item}
      initialBookmarked={initialBookmarked}
      initialReadChapterNames={initialReadChapterNames}
      initialTotalViews={initialTotalViews}
    />
  );
}
