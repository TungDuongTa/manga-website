"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
  Home,
  List,
  Settings,
  Maximize2,
  Minimize2,
  BookOpen,
  Sun,
  ZoomIn,
  ArrowUp,
  X,
  Bookmark,
  BookmarkCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { getComicDetail, getChapterData } from "@/lib/actions/otruyen-actions";
import {
  getReadChapterNames,
  markChapterAsRead,
} from "@/lib/actions/read-chapter.actions";
import {
  ComicDetailItem,
  ChapterImage,
  ChapterData,
  getChapterImageUrl,
} from "@/types/otruyen-types";

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
  const [readChapterNames, setReadChapterNames] = useState<string[]>([]);

  // Bottom navbar visibility — hide when scrolling down, show when scrolling up
  const [showBottomNav, setShowBottomNav] = useState(false);
  const lastScrollY = useRef(0);
  const scrollDelta = useRef(0);

  useEffect(() => {
    // Show bar initially after a short delay so it doesn't flash on load
    const t = setTimeout(() => setShowBottomNav(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;
      scrollDelta.current += diff;

      if (diff < 0) {
        // Scrolling up — always show
        setShowBottomNav(true);
        scrollDelta.current = 0;
      } else if (scrollDelta.current > 40) {
        // Scrolled down more than 40px total — hide
        setShowBottomNav(false);
        setShowSettings(false);
        setShowChapterList(false);
        scrollDelta.current = 0;
      }

      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch comic detail and chapter data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [detailData, readChapters] = await Promise.all([
          getComicDetail(id),
          getReadChapterNames(id),
        ]);

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

  const currentChapterIndex = chapters.findIndex(
    (c) => c.chapter_name === chapter,
  );
  const prevChapter =
    currentChapterIndex < chapters.length - 1
      ? chapters[currentChapterIndex + 1]
      : null;
  const nextChapter =
    currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingMode === "horizontal") {
        if (e.key === "ArrowLeft")
          setCurrentPage((prev) => Math.max(1, prev - 1));
        else if (e.key === "ArrowRight")
          setCurrentPage((prev) => Math.min(totalPages, prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readingMode, totalPages]);

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
      {/* Main Reader Content — no top padding since no top nav */}
      <main className="pb-24">
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
            <div className="overflow-y-auto flex-1 py-2">
              {chapters.map((ch, index) => {
                const isCurrent = ch.chapter_name === chapter;
                const isRead = readChapterNames.includes(ch.chapter_name);

                return (
                  <button
                    key={`${ch.chapter_name}-${index}`}
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

      {/* Bottom Navigation Bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border transition-transform duration-300 ${
          showBottomNav ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-3 h-16 max-w-3xl mx-auto gap-1">
          {/* Home */}
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              title="Home"
            >
              <Home className="h-5 w-5" />
            </Button>
          </Link>

          {/* Back to chapter list */}
          <Link href={`/manga/${comic.slug}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              title="Chapter List"
            >
              <List className="h-5 w-5" />
            </Button>
          </Link>

          {/* Prev Chapter */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={!prevChapter}
            onClick={() =>
              prevChapter &&
              router.push(
                `/manga/${comic.slug}/chapter/${prevChapter.chapter_name}`,
              )
            }
            title="Previous Chapter"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Current Chapter Block — click to open chapter list */}
          <button
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 h-10 bg-secondary hover:bg-secondary/70 rounded-lg px-3 transition-colors"
            onClick={() => setShowChapterList((v) => !v)}
          >
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate">
              Ch. {chapter}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rotate-90 shrink-0" />
          </button>

          {/* Next Chapter */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={!nextChapter}
            onClick={() =>
              nextChapter &&
              router.push(
                `/manga/${comic.slug}/chapter/${nextChapter.chapter_name}`,
              )
            }
            title="Next Chapter"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Bookmark */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 shrink-0 ${isBookmarked ? "text-primary" : ""}`}
            onClick={() => setIsBookmarked((v) => !v)}
            title="Bookmark"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 shrink-0 ${showSettings ? "text-primary" : ""}`}
            onClick={() => setShowSettings((v) => !v)}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Page slider for horizontal mode */}
        {readingMode === "horizontal" && (
          <div className="flex items-center gap-3 px-4 pb-3">
            <span className="text-xs text-muted-foreground w-6 text-right">
              {currentPage}
            </span>
            <Slider
              value={[currentPage]}
              onValueChange={([v]) => setCurrentPage(v)}
              min={1}
              max={totalPages}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-6">
              {totalPages}
            </span>
          </div>
        )}
      </nav>

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

