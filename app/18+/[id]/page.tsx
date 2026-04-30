import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MangaDetailPageClient } from "@/components/manga-detail-page-client";
import { isMangaBookmarked } from "@/lib/actions/bookmark.actions";
import { getManga18Detail } from "@/lib/actions/manga18.actions";
import { getMangaViewStats } from "@/lib/actions/manga-view.actions";
import { getReadingProgressChapterNames } from "@/lib/actions/reading-progress.actions";

export default async function Manga18DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [detailResult, bookmarkResult, readResult, viewResult] =
    await Promise.allSettled([
      getManga18Detail(id),
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
            Manga Not Found
          </h1>
          <Link href="/18+">
            <Button>Back to 18+ Library</Button>
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
      showComments={false}
    />
  );
}

