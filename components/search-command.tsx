"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { searchComicsQuick } from "@/lib/actions/otruyen-actions";
import {
  OTruyenComic,
  getImageUrl,
  formatUpdatedAt,
} from "@/types/otruyen-types";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OTruyenComic[]>([]);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      setHasSearched(true);
      startTransition(async () => {
        const data = await searchComicsQuick(query);
        setResults(data);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setHasSearched(false);
    }
  }, [open]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = useCallback(() => {
    onOpenChange(false);
    setQuery("");
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden bg-card border-border"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Search Manga</DialogTitle>
        <DialogDescription className="sr-only">
          Search for manga, manhwa, or manhua by title.
        </DialogDescription>

        {/* Search Input */}
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga, manhwa, manhua..."
            className="flex-1 bg-transparent px-4 py-4 text-base text-foreground placeholder:text-muted-foreground outline-none"
            autoFocus
          />
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
          )}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {!hasSearched && query.length < 2 ? (
            <div className="py-12 text-center text-muted-foreground">
              Type at least 2 characters to search...
            </div>
          ) : results.length === 0 && hasSearched && !isPending ? (
            <div className="py-12 text-center text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-2">
              {results.map((comic, index) => (
                <Link
                  key={comic._id || index}
                  href={`/manga/${comic.slug}`}
                  onClick={handleSelect}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary transition-colors group"
                >
                  {/* Cover Image */}
                  <div className="relative w-14 h-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={getImageUrl(comic.thumb_url)}
                      alt={comic.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {comic.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {comic.chaptersLatest?.[0]?.chapter_name
                        ? `Chapter ${comic.chaptersLatest[0].chapter_name}`
                        : formatUpdatedAt(comic.updatedAt)}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {comic.category.slice(0, 3).map((cat, index) => (
                        <Badge
                          key={`${comic._id}-${cat.id}-${index}`}
                          variant="secondary"
                          className="text-xs px-2 py-0.5 bg-secondary/80"
                        >
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* View All Results Button */}
        <div className="border-t border-border p-3">
          <Link
            href={`/browse${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            onClick={handleSelect}
          >
            <Button className="w-full gap-2" variant="default">
              View all results
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Search trigger button component
export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-2.5 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-secondary/60"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="text-sm flex-1 text-left">Search manga...</span>
      <kbd className="hidden h-6 items-center rounded-md border border-border/80 bg-secondary/80 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:inline-flex">
        Ctrl K
      </kbd>
    </button>
  );
}

