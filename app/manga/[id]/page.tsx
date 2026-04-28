import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MangaDetailPageClient } from "@/components/manga-detail-page-client";
import { isMangaBookmarked } from "@/lib/actions/bookmark.actions";
import { getMangaViewStats } from "@/lib/actions/manga-view.actions";
import { getComicDetail } from "@/lib/actions/otruyen-actions";
import { getReadingProgressChapterNames } from "@/lib/actions/reading-progress.actions";

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [detailResult, bookmarkResult, readResult, viewResult] =
    await Promise.allSettled([
      getComicDetail(id),
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
