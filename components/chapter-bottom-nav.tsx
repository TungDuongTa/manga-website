"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Home,
  Loader2,
  List,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChapterData } from "@/types/otruyen-types";

type ChapterBottomNavProps = {
  comicSlug: string;
  chapter: string;
  prevChapterName: string | null;
  nextChapterName: string | null;
  onToggleChapterList: () => void;
  showChapterList: boolean;
  onCloseChapterList: () => void;
  chapterList: ChapterData[];
  currentChapter: string;
  readChapterNames: string[];
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onToggleBookmark: () => void;
};

export default function ChapterBottomNav({
  comicSlug,
  chapter,
  prevChapterName,
  nextChapterName,
  onToggleChapterList,
  showChapterList,
  onCloseChapterList,
  chapterList,
  currentChapter,
  readChapterNames,
  isBookmarked,
  isBookmarkLoading,
  onToggleBookmark,
}: ChapterBottomNavProps) {
  const router = useRouter();
  const chapterListContainerRef = useRef<HTMLDivElement | null>(null);
  const currentChapterButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastScrollYRef = useRef(0);
  const [isNavVisible, setIsNavVisible] = useState(true);

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
  }, [showChapterList, currentChapter, chapterList.length]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      // Ignore tiny movements to reduce flicker on touch devices.
      if (Math.abs(delta) < 6) return;

      if (currentScrollY <= 0 || delta < 0) {
        setIsNavVisible(true);
      } else {
        setIsNavVisible(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md transition-transform duration-300 ${
          isNavVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-3 h-16 max-w-3xl mx-auto gap-1">
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

          <Link href={`/manga/${comicSlug}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              title="Chapter List"
            >
              <List className="h-5 w-5" />
            </Button>
          </Link>

          {prevChapterName ? (
            <Link href={`/manga/${comicSlug}/chapter/${prevChapterName}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                title="Previous Chapter"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled
              title="Previous Chapter"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          <button
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 h-10 bg-secondary hover:bg-secondary/70 rounded-lg px-3 transition-colors"
            onClick={onToggleChapterList}
          >
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate">
              Ch. {chapter}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rotate-90 shrink-0" />
          </button>

          {nextChapterName ? (
            <Link href={`/manga/${comicSlug}/chapter/${nextChapterName}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                title="Next Chapter"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled
              title="Next Chapter"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 shrink-0 ${isBookmarked ? "text-primary" : ""}`}
            onClick={onToggleBookmark}
            disabled={isBookmarkLoading}
            title="Bookmark"
          >
            {isBookmarkLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isBookmarked ? (
              <BookmarkCheck className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {showChapterList && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={onCloseChapterList}
        >
          <div
            className="w-full max-w-lg bg-card border border-border rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h3 className="font-semibold text-foreground">Chapter List</h3>
              <Button variant="ghost" size="icon" onClick={onCloseChapterList}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div
              ref={chapterListContainerRef}
              className="overflow-y-auto flex-1 py-2"
            >
              {chapterList.map((ch, index) => {
                const isCurrent = ch.chapter_name === currentChapter;
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
                      onCloseChapterList();
                      router.push(
                        `/manga/${comicSlug}/chapter/${ch.chapter_name}`,
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
    </>
  );
}
