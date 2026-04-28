"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import ChapterBottomNav from "@/components/chapter-bottom-nav";
import { MangaCommentsSection } from "@/components/manga-comments-section";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toggleMangaBookmark } from "@/lib/actions/bookmark.actions";
import { trackMangaChapterView } from "@/lib/actions/manga-view.actions";
import { markChapterAsReadProgress } from "@/lib/actions/reading-progress.actions";
import { compareChapterNames } from "@/lib/chapter-utils";
import {
  type ChapterImage,
  type ComicDetailItem,
  getChapterImageUrl,
} from "@/types/otruyen-types";

type ChapterReaderPageClientProps = {
  id: string;
  chapter: string;
  comic: ComicDetailItem;
  chapterImages: ChapterImage[];
  chapterPath: string;
  initialBookmarked: boolean;
  initialReadChapterNames: string[];
};

export function ChapterReaderPageClient({
  id,
  chapter,
  comic,
  chapterImages,
  chapterPath,
  initialBookmarked,
  initialReadChapterNames,
}: ChapterReaderPageClientProps) {
  const router = useRouter();
  const [showChapterList, setShowChapterList] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [readChapterNames, setReadChapterNames] = useState(
    initialReadChapterNames,
  );

  const chapters = comic.chapters?.[0]?.server_data || [];
  const orderedChapters = useMemo(
    () =>
      [...chapters].sort((a, b) =>
        compareChapterNames(a.chapter_name, b.chapter_name),
      ),
    [chapters],
  );
  const currentChapterIndex = orderedChapters.findIndex(
    (c) => c.chapter_name === chapter,
  );
  const chapterListChapters = [...orderedChapters].reverse();
  const prevChapter =
    currentChapterIndex > 0 ? orderedChapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < orderedChapters.length - 1
      ? orderedChapters[currentChapterIndex + 1]
      : null;
  const currentChapterInfo = chapters.find((c) => c.chapter_name === chapter);
  const latestChapter =
    chapters.length > 0 ? chapters[chapters.length - 1] : null;

  useEffect(() => {
    if (!currentChapterInfo) return;

    const recordChapterVisit = async () => {
      const [viewResult, markResult] = await Promise.allSettled([
        trackMangaChapterView({
          comicId: comic._id,
          comicSlug: comic.slug,
          comicName: comic.name,
          thumbUrl: comic.thumb_url,
          status: comic.status,
          comicUpdatedAt: comic.updatedAt,
          categories: comic.category || [],
          chapterName: chapter,
        }),
        markChapterAsReadProgress({
          comicId: comic._id,
          comicSlug: comic.slug,
          chapterName: chapter,
        }),
      ]);

      if (
        viewResult.status === "rejected" ||
        (viewResult.status === "fulfilled" && !viewResult.value.success)
      ) {
        console.error("Failed to track manga view:", comic.slug);
      }

      if (markResult.status === "fulfilled" && markResult.value.success) {
        setReadChapterNames((prev) =>
          prev.includes(chapter) ? prev : [chapter, ...prev],
        );
      }
    };

    recordChapterVisit();
  }, [
    chapter,
    comic._id,
    comic.category,
    comic.name,
    comic.slug,
    comic.status,
    comic.thumb_url,
    comic.updatedAt,
    currentChapterInfo,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const comicSlug = comic?.slug || id;

      if (e.key === "ArrowLeft") {
        if (prevChapter) {
          e.preventDefault();
          router.push(`/manga/${comicSlug}/chapter/${prevChapter.chapter_name}`);
        }
        return;
      }

      if (e.key === "ArrowRight") {
        if (nextChapter) {
          e.preventDefault();
          router.push(`/manga/${comicSlug}/chapter/${nextChapter.chapter_name}`);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevChapter, nextChapter, comic?.slug, id, router]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const getImageUrlForPage = (imageFile: string) =>
    getChapterImageUrl(chapterPath, imageFile);

  const handleBookmarkToggle = async () => {
    if (!comic || isBookmarkLoading) return;

    setIsBookmarkLoading(true);
    try {
      const result = await toggleMangaBookmark({
        comicId: comic._id,
        slug: comic.slug,
        name: comic.name,
        thumbUrl: comic.thumb_url,
        status: comic.status,
        comicUpdatedAt: comic.updatedAt,
        categories: comic.category || [],
        latestChapterName: latestChapter?.chapter_name,
      });

      if (!result.success) {
        toast.error(result.message);
        if (result.requiresSignIn) {
          router.push("/sign-in");
        }
        return;
      }

      setIsBookmarked(result.bookmarked);
      toast.success(result.message);
    } catch (error) {
      console.error("Failed to bookmark manga:", error);
      toast.error("Could not update bookmark. Please try again.");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <main className="pb-24">
        <section className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <Breadcrumb className="mb-3">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/manga/${comic.slug}`}>{comic.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Chapter {chapter}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <h1 className="line-clamp-2 text-lg font-bold text-foreground md:text-2xl">
                  {comic.name}
                </h1>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  Chapter {chapter}
                  {currentChapterInfo?.chapter_title
                    ? ` - ${currentChapterInfo.chapter_title}`
                    : ""}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
                {prevChapter ? (
                  <Link href={`/manga/${comic.slug}/chapter/${prevChapter.chapter_name}`}>
                    <Button variant="outline" className="gap-2">
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" className="gap-2" disabled>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}

                {nextChapter ? (
                  <Link href={`/manga/${comic.slug}/chapter/${nextChapter.chapter_name}`}>
                    <Button variant="outline" className="gap-2">
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" className="gap-2" disabled>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl md:px-4">
          {chapterImages.map((img, index) => (
            <div key={index} className="relative w-full">
              <Image
                src={getImageUrlForPage(img.image_file)}
                alt={`Page ${index + 1}`}
                width={800}
                height={1200}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          ))}
        </div>

        <section className="mx-auto max-w-7xl py-6 md:px-4">
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="mb-3 flex shrink-0 flex-wrap items-center justify-center gap-2">
              {prevChapter ? (
                <Link href={`/manga/${comic.slug}/chapter/${prevChapter.chapter_name}`}>
                  <Button variant="outline" className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="gap-2" disabled>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}

              {nextChapter ? (
                <Link href={`/manga/${comic.slug}/chapter/${nextChapter.chapter_name}`}>
                  <Button variant="outline" className="gap-2">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="gap-2" disabled>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/manga/${comic.slug}`}>{comic.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Chapter {chapter}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8">
          <MangaCommentsSection
            comicSlug={comic.slug || id}
            comicName={comic.name || ""}
            chapterName={chapter}
          />
        </section>
      </main>

      <ChapterBottomNav
        comicSlug={comic.slug}
        chapter={chapter}
        prevChapterName={prevChapter?.chapter_name ?? null}
        nextChapterName={nextChapter?.chapter_name ?? null}
        onToggleChapterList={() => setShowChapterList((v) => !v)}
        showChapterList={showChapterList}
        onCloseChapterList={() => setShowChapterList(false)}
        chapterList={chapterListChapters}
        currentChapter={chapter}
        readChapterNames={readChapterNames}
        isBookmarked={isBookmarked}
        isBookmarkLoading={isBookmarkLoading}
        onToggleBookmark={handleBookmarkToggle}
      />

      <Button
        variant="secondary"
        size="icon"
        className="fixed bottom-20 right-4 z-40 hidden h-10 w-10 rounded-full shadow-lg md:flex"
        onClick={scrollToTop}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
