"use client";

import Link from "next/link";
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Home,
  Loader2,
  List,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type ReadingMode = "vertical" | "horizontal" | "webtoon";

type ChapterBottomNavProps = {
  comicSlug: string;
  chapter: string;
  prevChapterName: string | null;
  nextChapterName: string | null;
  onToggleChapterList: () => void;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  onToggleBookmark: () => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  readingMode: ReadingMode;
  currentPage: number;
  totalPages: number;
  onCurrentPageChange: (page: number) => void;
};

export default function ChapterBottomNav({
  comicSlug,
  chapter,
  prevChapterName,
  nextChapterName,
  onToggleChapterList,
  isBookmarked,
  isBookmarkLoading,
  onToggleBookmark,
  showSettings,
  onToggleSettings,
  readingMode,
  currentPage,
  totalPages,
  onCurrentPageChange,
}: ChapterBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border transition-transform duration-300">
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

        <Button
          variant="ghost"
          size="icon"
          className={`h-10 w-10 shrink-0 ${showSettings ? "text-primary" : ""}`}
          onClick={onToggleSettings}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {readingMode === "horizontal" && (
        <div className="flex items-center gap-3 px-4 pb-3">
          <span className="text-xs text-muted-foreground w-6 text-right">
            {currentPage}
          </span>
          <Slider
            value={[currentPage]}
            onValueChange={([v]) => onCurrentPageChange(v)}
            min={1}
            max={totalPages}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-6">{totalPages}</span>
        </div>
      )}
    </nav>
  );
}
