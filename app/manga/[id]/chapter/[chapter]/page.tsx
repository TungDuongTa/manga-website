"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sun,
  ZoomIn,
  ArrowUp,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import ChapterBottomNav from "@/components/chapter-bottom-nav";
import { getComicDetail, getChapterData } from "@/lib/actions/otruyen-actions";
import {
  isMangaBookmarked,
  toggleMangaBookmark,
} from "@/lib/actions/bookmark.actions";
import {
  getReadChapterNames,
  markChapterAsRead,
} from "@/lib/actions/read-chapter.actions";
import { toast } from "sonner";
import {
  ComicDetailItem,
  ChapterImage,
  ChapterData,
  getChapterImageUrl,
} from "@/types/otruyen-types";

const chapterLabelCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const parseChapterNumber = (chapterName: string): number | null => {
  const parsed = Number.parseFloat(chapterName);
  return Number.isFinite(parsed) ? parsed : null;
};

const compareChapterNames = (a: string, b: string): number => {
  if (a === b) return 0;

  const aNum = parseChapterNumber(a);
  const bNum = parseChapterNumber(b);

  if (aNum !== null && bNum !== null) {
    return aNum - bNum;
  }

  if (aNum !== null) return 1;
  if (bNum !== null) return -1;

  return chapterLabelCollator.compare(a, b);
};

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

  const [currentPage, setCurrentPage] = useState(1);
  const [readingMode, setReadingMode] = useState<
    "vertical" | "horizontal" | "webtoon"
  >("vertical");
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [readChapterNames, setReadChapterNames] = useState<string[]>([]);
  const chapterListContainerRef = useRef<HTMLDivElement | null>(null);
  const currentChapterButtonRef = useRef<HTMLButtonElement | null>(null);

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
            const marked = await markChapterAsRead({
              comicId: detailData.item._id,
              comicSlug: detailData.item.slug,
              comicName: detailData.item.name,
              thumbUrl: detailData.item.thumb_url,
              status: detailData.item.status,
              comicUpdatedAt: detailData.item.updatedAt,
              categories: detailData.item.category || [],
              chapterName: chapter,
            });

            if (marked.success) {
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

  const totalPages = chapterImages.length;

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
        // In horizontal mode, keep page-by-page navigation until first page.
        if (readingMode === "horizontal" && currentPage > 1) {
          e.preventDefault();
          setCurrentPage((prev) => Math.max(1, prev - 1));
          return;
        }

        if (prevChapter) {
          e.preventDefault();
          router.push(
            `/manga/${comicSlug}/chapter/${prevChapter.chapter_name}`,
          );
        }
        return;
      }

      if (e.key === "ArrowRight") {
        // In horizontal mode, keep page-by-page navigation until last page.
        if (readingMode === "horizontal" && currentPage < totalPages) {
          e.preventDefault();
          setCurrentPage((prev) => Math.min(totalPages, prev + 1));
          return;
        }

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
  }, [
    readingMode,
    totalPages,
    currentPage,
    prevChapter,
    nextChapter,
    comic?.slug,
    id,
    router,
  ]);

  useEffect(() => {
    if (!showChapterList) return;

    const raf = window.requestAnimationFrame(() => {
      const container = chapterListContainerRef.current;
      const currentButton = currentChapterButtonRef.current;

      if (!container || !currentButton) return;

      const containerTop = container.getBoundingClientRect().top;
      const currentButtonTop = currentButton.getBoundingClientRect().top;
      const offset = currentButtonTop - containerTop;

      container.scrollTop += offset;
    });

    return () => window.cancelAnimationFrame(raf);
  }, [showChapterList, chapter, chapterListChapters.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!comic || chapterImages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
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
    <div
      className="min-h-screen bg-background"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* Main Reader Content â€” no top padding since no top nav */}
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
        {readingMode === "horizontal" ? (
          <div className="flex items-center justify-center min-h-screen px-4">
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-card/80"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((prev) => Math.max(1, prev - 1));
              }}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div
              className="relative max-w-4xl w-full mx-auto"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                <Image
                  src={getImageUrlForPage(
                    chapterImages[currentPage - 1]?.image_file,
                  )}
                  alt={`Page ${currentPage}`}
                  width={800}
                  height={1200}
                  className="w-full h-auto"
                  priority
                  unoptimized
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="fixed right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-card/80"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((prev) => Math.min(totalPages, prev + 1));
              }}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        ) : (
          <div
            className="max-w-4xl mx-auto px-4"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
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
        )}
      </main>

      {/* Chapter List Popup */}
      {showChapterList && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setShowChapterList(false)}
        >
          <div
            className="w-full max-w-lg bg-card border border-border rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h3 className="font-semibold text-foreground">Chapter List</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChapterList(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div ref={chapterListContainerRef} className="overflow-y-auto flex-1 py-2">
              {chapterListChapters.map((ch, index) => {
                const isCurrent = ch.chapter_name === chapter;
                const isRead = readChapterNames.includes(ch.chapter_name);

                return (
                  <button
                    key={`${ch.chapter_name}-${index}`}
                    ref={isCurrent ? currentChapterButtonRef : undefined}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      isCurrent
                        ? "text-primary font-semibold bg-primary/10"
                        : isRead
                          ? "text-primary bg-primary/5 hover:bg-primary/10"
                          : "text-foreground hover:bg-secondary/60"
                    }`}
                    onClick={() => {
                      setShowChapterList(false);
                      router.push(
                        `/manga/${comic.slug}/chapter/${ch.chapter_name}`,
                      );
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        Chapter {ch.chapter_name}
                        {ch.chapter_title ? ` - ${ch.chapter_title}` : ""}
                      </span>
                      {isRead && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Read
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed bottom-20 right-4 z-50 w-72 bg-card border border-border rounded-xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Reader Settings</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Reading Mode
              </label>
              <Select
                value={readingMode}
                onValueChange={(v: "vertical" | "horizontal" | "webtoon") =>
                  setReadingMode(v)
                }
              >
                <SelectTrigger className="bg-secondary border-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical Scroll</SelectItem>
                  <SelectItem value="horizontal">
                    Horizontal (Page by Page)
                  </SelectItem>
                  <SelectItem value="webtoon">Webtoon (No Gaps)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Brightness
                </span>
                <span>{brightness}%</span>
              </label>
              <Slider
                value={[brightness]}
                onValueChange={([v]) => setBrightness(v)}
                min={50}
                max={150}
                step={5}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </span>
                <span>{zoom}%</span>
              </label>
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={50}
                max={200}
                step={10}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </Button>
          </div>
        </div>
      )}

      <ChapterBottomNav
        comicSlug={comic.slug}
        chapter={chapter}
        prevChapterName={prevChapter?.chapter_name ?? null}
        nextChapterName={nextChapter?.chapter_name ?? null}
        onToggleChapterList={() => setShowChapterList((v) => !v)}
        isBookmarked={isBookmarked}
        isBookmarkLoading={isBookmarkLoading}
        onToggleBookmark={handleBookmarkToggle}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((v) => !v)}
        readingMode={readingMode}
        currentPage={currentPage}
        totalPages={totalPages}
        onCurrentPageChange={setCurrentPage}
      />

      {/* Scroll to top */}
      {readingMode !== "horizontal" && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-20 right-4 z-40 h-10 w-10 rounded-full shadow-lg"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
