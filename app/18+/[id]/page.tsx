import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MangaDetailPageClient } from "@/components/manga-detail-page-client";
import { isMangaBookmarked } from "@/lib/actions/bookmark.actions";
import { getManga18Detail } from "@/lib/actions/manga18.actions";
import { getMangaViewStats } from "@/lib/actions/manga-view.actions";
import { getReadingProgressChapterNames } from "@/lib/actions/reading-progress.actions";
import { stripHtml, truncateText, withSiteSuffix } from "@/lib/seo";
import { getImageUrl } from "@/types/otruyen-types";

type Manga18DetailPageProps = {
  params: Promise<{ id: string }>;
};

const getManga18DetailCached = cache(async (slug: string) =>
  getManga18Detail(slug),
);

export async function generateMetadata({
  params,
}: Manga18DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const comic = await getManga18DetailCached(id);
  const canonicalPath = `/18+/${comic?.slug || id}`;

  if (!comic) {
    return {
      title: "Không tìm thấy truyện tranh 18+ nào.",
      description: "Không tìm thấy truyện tranh 18+ nào.",
      alternates: {
        canonical: canonicalPath,
      },
    };
  }

  const fallbackDescription = `Đọc truyện 18+ ${comic.name} mới nhất được cập nhật liên tục tại VuaTruyen`;
  const description = truncateText(
    stripHtml(comic.content || "") || fallbackDescription,
    160,
  );
  const title = `${comic.name} (18+)`;
  const coverImage = comic.thumb_url?.trim()
    ? getImageUrl(comic.thumb_url)
    : "";

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

export default async function Manga18DetailPage({
  params,
}: Manga18DetailPageProps) {
  const { id } = await params;

  const [detailResult, bookmarkResult, readResult, viewResult] =
    await Promise.allSettled([
      getManga18DetailCached(id),
      isMangaBookmarked(id),
      getReadingProgressChapterNames(id),
      getMangaViewStats(id),
    ]);

  const comic = detailResult.status === "fulfilled" ? detailResult.value : null;
  if (!comic) {
    return (
      <div className="min-h-screen">
        <main className="flex min-h-[60vh] flex-col items-center justify-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Không tìm thấy truyện
          </h1>
          <Link href="/18+">
            <Button>Về thư viện 18+</Button>
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
      comic={comic}
      initialBookmarked={initialBookmarked}
      initialReadChapterNames={initialReadChapterNames}
      initialTotalViews={initialTotalViews}
      routeBase="/18+"
    />
  );
}
