"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronLeft, ChevronRight, ArrowUp, Loader2 } from "lucide-react";
import ChapterBottomNav from "@/components/chapter-bottom-nav";
import { MangaCommentsSection } from "@/components/manga-comments-section";
import { getComicDetail, getChapterData } from "@/lib/actions/otruyen-actions";
import {
  isMangaBookmarked,
  toggleMangaBookmark,
} from "@/lib/actions/bookmark.actions";
import {
  getReadChapterNames,
  markChapterAsRead,
} from "@/lib/actions/read-chapter.actions";
import { trackMangaChapterView } from "@/lib/actions/manga-view.actions";
import { toast } from "sonner";
import {
  ComicDetailItem,
  ChapterImage,
  ChapterData,
  getChapterImageUrl,
} from "@/types/otruyen-types";
import { compareChapterNames } from "@/lib/chapter-utils";

export default function ChapterReaderPage({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>;
}) {
  const { id, chapter } = use(params);
  const router = useRouter();

  const [comic, setComic] = useState<ComicDetailItem | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [chapterImages, setChapterImages] = useState<ChapterImage[]>([]);
  const [chapterPath, setChapterPath] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showChapterList, setShowChapterList] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [readChapterNames, setReadChapterNames] = useState<string[]>([]);

  // Fetch comic detail and chapter data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [detailData, bookmarked, readChapters] = await Promise.all([
          getComicDetail(id),
          isMangaBookmarked(id),
          getReadChapterNames(id),
        ]);

        setIsBookmarked(bookmarked);
        setReadChapterNames(readChapters);

        if (detailData?.item) {
          setComic(detailData.item);
          const allChapters = detailData.item.chapters?.[0]?.server_data || [];
          setChapters(allChapters);

          const currentChapterData = allChapters.find(
            (c) => c.chapter_name === chapter,
          );

          if (currentChapterData?.chapter_api_data) {
            const chapterContent = await getChapterData(
              currentChapterData.chapter_api_data,
            );
            if (chapterContent?.item) {
              setChapterImages(chapterContent.item.chapter_image);
              setChapterPath(chapterContent.item.chapter_path);
            }
          }

          if (currentChapterData) {
            const [viewResult, markResult] = await Promise.allSettled([
              trackMangaChapterView({
                comicId: detailData.item._id,
                comicSlug: detailData.item.slug,
                comicName: detailData.item.name,
                thumbUrl: detailData.item.thumb_url,
                status: detailData.item.status,
                comicUpdatedAt: detailData.item.updatedAt,
                categories: detailData.item.category || [],
                chapterName: chapter,
              }),
              markChapterAsRead({
                comicId: detailData.item._id,
                comicSlug: detailData.item.slug,
                comicName: detailData.item.name,
                thumbUrl: detailData.item.thumb_url,
                status: detailData.item.status,
                comicUpdatedAt: detailData.item.updatedAt,
                categories: detailData.item.category || [],
                chapterName: chapter,
              }),
            ]);

            if (
              viewResult.status === "rejected" ||
              (viewResult.status === "fulfilled" && !viewResult.value.success)
            ) {
              console.error("Failed to track manga view:", detailData.item.slug);
            }

            if (
              markResult.status === "fulfilled" &&
              markResult.value.success
            ) {
              setReadChapterNames((prev) =>
                prev.includes(chapter) ? prev : [chapter, ...prev],
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch chapter:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, chapter]);

  const orderedChapters = [...chapters].sort((a, b) =>
    compareChapterNames(a.chapter_name, b.chapter_name),
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
          router.push(
            `/manga/${comicSlug}/chapter/${prevChapter.chapter_name}`,
          );
        }
        return;
      }

      if (e.key === "ArrowRight") {
        if (nextChapter) {
          e.preventDefault();
          router.push(
            `/manga/${comicSlug}/chapter/${nextChapter.chapter_name}`,
          );
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!comic || chapterImages.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Chapter Not Found
        </h1>
        <Link href={`/manga/${id}`}>
          <Button>Go Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Main Reader Content  no top padding since no top nav */}
      <main className="pb-24">
        <section className="mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="bg-card border border-border rounded-xl p-4 md:p-5">
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
                <h1 className="text-lg md:text-2xl font-bold text-foreground line-clamp-2">
                  {comic.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  Chapter {chapter}
                  {currentChapterInfo?.chapter_title
                    ? ` - ${currentChapterInfo.chapter_title}`
                    : ""}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 shrink-0 flex-wrap">
                {prevChapter ? (
                  <Link
                    href={`/manga/${comic.slug}/chapter/${prevChapter.chapter_name}`}
                  >
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
                  <Link
                    href={`/manga/${comic.slug}/chapter/${nextChapter.chapter_name}`}
                  >
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
        <div className="max-w-4xl mx-auto md:px-4">
          {chapterImages.map((img, index) => (
            <div key={index} className="relative w-full">
              <Image
                src={getImageUrlForPage(img.image_file)}
                alt={`Page ${index + 1}`}
                width={800}
                height={1200}
                className="w-full h-auto"
                unoptimized
              />
            </div>
          ))}
        </div>
        <section className="mx-auto max-w-7xl md:px-4 py-6">
          <div className="bg-card border border-border rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-center gap-2 shrink-0 flex-wrap mb-3">
              {prevChapter ? (
                <Link
                  href={`/manga/${comic.slug}/chapter/${prevChapter.chapter_name}`}
                >
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
                <Link
                  href={`/manga/${comic.slug}/chapter/${nextChapter.chapter_name}`}
                >
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

      {/* Scroll to top */}
      <Button
        variant="secondary"
        size="icon"
        className="fixed bottom-20 right-4 z-40 h-10 w-10 rounded-full shadow-lg md:flex hidden"
        onClick={scrollToTop}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
