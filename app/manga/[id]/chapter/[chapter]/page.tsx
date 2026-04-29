import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChapterReaderPageClient } from "@/components/chapter-reader-page-client";
import { isMangaBookmarked } from "@/lib/actions/bookmark.actions";
import { getComicDetail, getChapterData } from "@/lib/actions/otruyen-actions";
import { getReadingProgressChapterNames } from "@/lib/actions/reading-progress.actions";

export default async function ChapterReaderPage({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>;
}) {
  const { id, chapter } = await params;

  const [detailResult, bookmarkResult, readResult] = await Promise.allSettled([
    getComicDetail(id),
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
