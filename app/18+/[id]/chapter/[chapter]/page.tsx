import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChapterReaderPageClient } from "@/components/chapter-reader-page-client";
import { isMangaBookmarked } from "@/lib/actions/bookmark.actions";
import {
  getManga18ChapterContent,
  getManga18Detail,
} from "@/lib/actions/manga18.actions";
import { getReadingProgressChapterNames } from "@/lib/actions/reading-progress.actions";

export default async function Manga18ChapterReaderPage({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>;
}) {
  const { id, chapter } = await params;

  const [detailResult, chapterResult, bookmarkResult, readResult] =
    await Promise.allSettled([
      getManga18Detail(id),
      getManga18ChapterContent({ mangaSlug: id, chapter }),
      isMangaBookmarked(id),
      getReadingProgressChapterNames(id),
    ]);

  const comic = detailResult.status === "fulfilled" ? detailResult.value : null;
  const chapterContent =
    chapterResult.status === "fulfilled" ? chapterResult.value : null;
  const initialBookmarked =
    bookmarkResult.status === "fulfilled" ? bookmarkResult.value : false;
  const initialReadChapterNames =
    readResult.status === "fulfilled" ? readResult.value : [];

  if (!comic || !chapterContent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          Chapter Not Found
        </h1>
        <Link href={`/18+/${id}`}>
          <Button>Go Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <ChapterReaderPageClient
      id={id}
      chapter={chapterContent.chapterName}
      comic={comic}
      chapterImages={chapterContent.chapterImages}
      chapterPath=""
      initialBookmarked={initialBookmarked}
      initialReadChapterNames={initialReadChapterNames}
      routeBase="/18+"
      showComments={false}
    />
  );
}

