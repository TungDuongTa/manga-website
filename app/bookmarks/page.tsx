import Link from "next/link";
import { headers } from "next/headers";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Trash2,
} from "lucide-react";
import { MangaCardApi } from "@/components/manga-card-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/better-auth/auth";
import { getVisiblePages } from "@/lib/pagination";
import { formatShortDate } from "@/lib/date-time";
import {
  getCurrentUserBookmarks,
  removeMangaBookmark,
} from "@/lib/actions/bookmark.actions";
import { getCurrentUserReadingHistory } from "@/lib/actions/reading-progress.actions";
import { getSessionUser } from "@/lib/server-session";

const ITEMS_PER_PAGE = 24;

const normalizePage = (value: string | undefined, totalPages: number) => {
  const parsed = Number.parseInt(value || "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, totalPages);
};

interface BookmarksPageProps {
  searchParams: Promise<{
    tab?: string;
    bookmarkPage?: string;
    historyPage?: string;
  }>;
}

export default async function BookmarksPage({
  searchParams,
}: BookmarksPageProps) {
  const params = await searchParams;
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Sign In Required
            </h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to view and manage your manga bookmarks.
            </p>
            <Link href="/sign-in">
              <Button>Go to Sign In</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const [bookmarkedManga, readingHistory] = await Promise.all([
    getCurrentUserBookmarks(),
    getCurrentUserReadingHistory(),
  ]);

  const bookmarksTotalPages = Math.max(
    1,
    Math.ceil(bookmarkedManga.length / ITEMS_PER_PAGE),
  );
  const historyTotalPages = Math.max(
    1,
    Math.ceil(readingHistory.length / ITEMS_PER_PAGE),
  );

  const bookmarkPage = normalizePage(params.bookmarkPage, bookmarksTotalPages);
  const historyPage = normalizePage(params.historyPage, historyTotalPages);

  const paginatedBookmarks = bookmarkedManga.slice(
    (bookmarkPage - 1) * ITEMS_PER_PAGE,
    bookmarkPage * ITEMS_PER_PAGE,
  );
  const paginatedHistory = readingHistory.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE,
  );

  const defaultTab =
    params.tab === "bookmarks" || params.tab === "history"
      ? params.tab
      : bookmarkedManga.length > 0
        ? "bookmarks"
        : "history";

  const buildPageHref = (
    tab: "bookmarks" | "history",
    nextBookmarkPage: number,
    nextHistoryPage: number,
  ) => {
    const query = new URLSearchParams();
    query.set("tab", tab);
    if (nextBookmarkPage > 1) {
      query.set("bookmarkPage", String(nextBookmarkPage));
    }
    if (nextHistoryPage > 1) {
      query.set("historyPage", String(nextHistoryPage));
    }
    return `/bookmarks?${query.toString()}`;
  };

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">My Library</h1>
          </div>
          <p className="text-muted-foreground">
            Your bookmarks and reading history.
          </p>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full justify-start bg-card border border-border rounded-xl p-1 h-auto flex-wrap mb-8">
            <TabsTrigger value="bookmarks" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Bookmarks ({bookmarkedManga.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock3 className="h-4 w-4" />
              Reading History ({readingHistory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookmarks">
            {bookmarkedManga.length > 0 ? (
              <>
                <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                  <Badge className="bg-accent text-accent-foreground">
                    {bookmarkedManga.length} saved
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Page {bookmarkPage} of {bookmarksTotalPages}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {paginatedBookmarks.map((manga) => {
                    const removeAction = removeMangaBookmark.bind(
                      null,
                      manga.slug,
                    );

                    return (
                      <div key={manga.slug}>
                        <MangaCardApi comic={manga} />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground">
                            Saved {formatShortDate(manga.bookmarkedAt)}
                          </p>
                          <form action={removeAction}>
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`Remove ${manga.name} from bookmarks`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {bookmarksTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {bookmarkPage > 1 ? (
                      <Link
                        href={buildPageHref(
                          "bookmarks",
                          bookmarkPage - 1,
                          historyPage,
                        )}
                      >
                        <Button variant="outline" size="icon">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="icon" disabled>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}

                    <div className="flex items-center gap-1">
                      {getVisiblePages(bookmarkPage, bookmarksTotalPages).map(
                        (pageNum) => (
                          <Link
                            key={`bookmark-page-${pageNum}`}
                            href={buildPageHref(
                              "bookmarks",
                              pageNum,
                              historyPage,
                            )}
                          >
                            <Button
                              variant={
                                pageNum === bookmarkPage ? "default" : "outline"
                              }
                              size="icon"
                            >
                              {pageNum}
                            </Button>
                          </Link>
                        ),
                      )}
                    </div>

                    {bookmarkPage < bookmarksTotalPages ? (
                      <Link
                        href={buildPageHref(
                          "bookmarks",
                          bookmarkPage + 1,
                          historyPage,
                        )}
                      >
                        <Button variant="outline" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="icon" disabled>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No bookmarks yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start adding manga and they will appear here.
                </p>
                <Link href="/browse">
                  <Button>Browse Manga</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {readingHistory.length > 0 ? (
              <>
                <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                  <Badge className="bg-accent text-accent-foreground">
                    {readingHistory.length} manga in history
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Page {historyPage} of {historyTotalPages}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {paginatedHistory.map((manga) => (
                    <div key={manga.slug}>
                      <MangaCardApi comic={manga} />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Last read {formatShortDate(manga.latestReadAt)}
                      </p>
                    </div>
                  ))}
                </div>

                {historyTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {historyPage > 1 ? (
                      <Link
                        href={buildPageHref(
                          "history",
                          bookmarkPage,
                          historyPage - 1,
                        )}
                      >
                        <Button variant="outline" size="icon">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="icon" disabled>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}

                    <div className="flex items-center gap-1">
                      {getVisiblePages(historyPage, historyTotalPages).map(
                        (pageNum) => (
                          <Link
                            key={`history-page-${pageNum}`}
                            href={buildPageHref(
                              "history",
                              bookmarkPage,
                              pageNum,
                            )}
                          >
                            <Button
                              variant={
                                pageNum === historyPage ? "default" : "outline"
                              }
                              size="icon"
                            >
                              {pageNum}
                            </Button>
                          </Link>
                        ),
                      )}
                    </div>

                    {historyPage < historyTotalPages ? (
                      <Link
                        href={buildPageHref(
                          "history",
                          bookmarkPage,
                          historyPage + 1,
                        )}
                      >
                        <Button variant="outline" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="icon" disabled>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <Clock3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No reading history yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start reading chapters and your history will appear here.
                </p>
                <Link href="/browse">
                  <Button>Start Reading</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
