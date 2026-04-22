"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MangaCardApi } from "@/components/manga-card-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Grid,
  List,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  searchComics,
  getListByType,
  getByCategory,
  getCategories,
} from "@/lib/actions/otruyen-actions";
import { OTruyenComic, Category, Pagination } from "@/types/otruyen-types";

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialQuery = searchParams.get("q") || "";
  const initialGenres =
    searchParams.get("genres")?.split(",").filter(Boolean) || [];
  const initialStatus = searchParams.get("status") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1");

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const [comics, setComics] = useState<OTruyenComic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search query — update debouncedQuery 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories on mount
  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  // Fetch comics based on filters
  useEffect(() => {
    const fetchComics = async () => {
      setIsLoading(true);

      try {
        if (debouncedQuery.trim()) {
          const data = await searchComics(debouncedQuery, currentPage);
          if (data) {
            setComics(data.items);
            setPagination(data.params.pagination);
          }
        } else if (selectedGenres.length > 0) {
          // Use the first selected genre for API (API supports one at a time),
          // remaining genres are visual — filter client-side
          const data = await getByCategory(selectedGenres[0], currentPage);
          if (data) {
            const filtered =
              selectedGenres.length > 1
                ? data.items.filter((comic) =>
                    selectedGenres.every((slug) =>
                      comic.category?.some((cat) => cat.slug === slug),
                    ),
                  )
                : data.items;
            setComics(filtered);
            setPagination(data.params.pagination);
          }
        } else {
          let listType = "truyen-moi";
          if (selectedStatus === "completed") listType = "hoan-thanh";
          else if (selectedStatus === "ongoing") listType = "dang-phat-hanh";

          const data = await getListByType(listType, currentPage);
          if (data) {
            setComics(data.items);
            setPagination(data.params.pagination);
          }
        }
      } catch (error) {
        console.error("Failed to fetch comics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    startTransition(() => {
      fetchComics();
    });
  }, [debouncedQuery, selectedGenres, selectedStatus, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateUrl();
  };

  const updateUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedGenres.length > 0)
      params.set("genres", selectedGenres.join(","));
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (currentPage > 1) params.set("page", currentPage.toString());
    router.push(`/browse?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedGenres([]);
    setSelectedStatus("all");
    setCurrentPage(1);
    router.push("/browse");
  };

  const handleGenreToggle = (slug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug],
    );
    setCurrentPage(1);
  };

  const removeGenre = (slug: string) => {
    setSelectedGenres((prev) => prev.filter((g) => g !== slug));
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters =
    selectedGenres.length > 0 || selectedStatus !== "all" || debouncedQuery;
  const totalPages = pagination
    ? Math.ceil(pagination.totalItems / pagination.totalItemsPerPage)
    : 1;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Browse Library
          </h1>
          <p className="text-muted-foreground">
            Discover thousands of manga, manhwa, and manhua titles
          </p>
        </div>

        {/* Search and Controls */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-card border-border"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>

            <Button
              type="button"
              variant={showFilters ? "default" : "outline"}
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
              {selectedGenres.length > 0 && (
                <span className="ml-1 bg-primary-foreground text-primary rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                  {selectedGenres.length}
                </span>
              )}
            </Button>

            <div className="flex border border-border rounded-md overflow-hidden">
              <Button
                type="button"
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Filters</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Status
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="bg-secondary border-none">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Genre Tags — multi-select */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Genres
                {selectedGenres.length > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({selectedGenres.length} selected)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category, index) => {
                  const isActive = selectedGenres.includes(category.slug);
                  return (
                    <Badge
                      key={category.id || index}
                      variant={isActive ? "default" : "outline"}
                      className={`cursor-pointer select-none transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "hover:bg-primary/20 hover:border-primary"
                      }`}
                      onClick={() => handleGenreToggle(category.slug)}
                    >
                      {category.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">
              Active filters:
            </span>
            {debouncedQuery && (
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedQuery("");
                }}
              >
                Search: {debouncedQuery}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {selectedStatus !== "all" && (
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => setSelectedStatus("all")}
              >
                {selectedStatus}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {selectedGenres.map((slug) => (
              <Badge
                key={slug}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => removeGenre(slug)}
              >
                {categories.find((c) => c.slug === slug)?.name || slug}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {pagination ? (
              <>
                Showing {comics.length} of {pagination.totalItems} results
              </>
            ) : (
              <>Showing {comics.length} results</>
            )}
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : comics.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 max-w-screen">
                {comics.map((comic, index) => (
                  <MangaCardApi key={comic._id || index} comic={comic} />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 max-w-screen">
                {comics.map((comic) => (
                  <MangaCardApi
                    key={comic._id}
                    comic={comic}
                    variant="horizontal"
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          pageNum === currentPage ? "default" : "outline"
                        }
                        size="icon"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No manga found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </main>
    </div>
  );
}
