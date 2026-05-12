import type { Metadata } from "next";
import Link from "next/link";
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
import { getVisiblePages, toPositiveInt } from "@/lib/pagination";
import { formatShortDate } from "@/lib/date-time";
import {
  getCurrentUserBookmarksCount,
  getCurrentUserBookmarksPage,
  removeMangaBookmark,
} from "@/lib/actions/bookmark.actions";
import {
  getCurrentUserReadingHistoryCount,
  getCurrentUserReadingHistoryPage,
} from "@/lib/actions/reading-progress.actions";
import { getSessionUser } from "@/lib/server-session";
import { withSiteSuffix } from "@/lib/seo";

const ITEMS_PER_PAGE = 24;

export const metadata: Metadata = {
  title: "Theo dõi",
  description:
    "Quản lí danh sách truyện yêu thích và lịch sử đọc truyện của bạn",
  alternates: {
    canonical: "/bookmarks",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: withSiteSuffix("Theo dõi"),
    description:
      "Quản lí danh sách truyện yêu thích và lịch sử đọc truyện của bạn",
    url: "/bookmarks",
  },
};

interface BookmarksPageProps {
  searchParams: Promise<{
    tab?: string;
    bookmarkPage?: string;
    historyPage?: string;
  }>;
}

type BookmarksTab = "bookmarks" | "history";

const normalizeBookmarksTab = (value?: string): BookmarksTab | null => {
  if (value === "bookmarks" || value === "history") {
    return value;
  }
  return null;
};

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
              Vui lòng đăng nhập
            </h1>
            <p className="text-muted-foreground mb-6">
              Vui lòng đăng nhập để xem danh sách theo dõi của bạn
            </p>
            <Link href="/sign-in">
              <Button>Đăng nhập</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const requestedBookmarkPage = toPositiveInt(params.bookmarkPage, 1);
  const requestedHistoryPage = toPositiveInt(params.historyPage, 1);
  const requestedTab = normalizeBookmarksTab(params.tab);
  const [bookmarkTotalItems, historyTotalItems] = await Promise.all([
    getCurrentUserBookmarksCount(),
    getCurrentUserReadingHistoryCount(),
  ]);
  const activeTab: BookmarksTab =
    requestedTab || (bookmarkTotalItems > 0 ? "bookmarks" : "history");
  const bookmarkResult =
    activeTab === "bookmarks"
      ? await getCurrentUserBookmarksPage({
          page: requestedBookmarkPage,
          pageSize: ITEMS_PER_PAGE,
        })
      : null;
  const historyResult =
    activeTab === "history"
      ? await getCurrentUserReadingHistoryPage({
          page: requestedHistoryPage,
          pageSize: ITEMS_PER_PAGE,
        })
      : null;
  const bookmarkedManga = bookmarkResult?.items || [];
  const readingHistory = historyResult?.items || [];
  const bookmarkPage = bookmarkResult?.page ?? requestedBookmarkPage;
  const historyPage = historyResult?.page ?? requestedHistoryPage;
  const bookmarksTotalPages =
    bookmarkResult?.totalPages ||
    Math.max(1, Math.ceil(bookmarkTotalItems / ITEMS_PER_PAGE));
  const historyTotalPages =
    historyResult?.totalPages ||
    Math.max(1, Math.ceil(historyTotalItems / ITEMS_PER_PAGE));

  const buildPageHref = (
    tab: BookmarksTab,
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

  const buildTabHref = (tab: BookmarksTab) =>
    buildPageHref(tab, bookmarkPage, historyPage);

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Theo dõi</h1>
          </div>
          <p className="text-muted-foreground">
            Danh sách theo dõi và lịch sử đọc truyện
          </p>
        </div>

        <div className="text-muted-foreground inline-flex items-center w-full justify-start bg-card border border-border rounded-xl p-1 h-auto flex-wrap mb-8">
          <Link
            href={buildTabHref("bookmarks")}
            className={`inline-flex flex-1 justify-center items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "bookmarks"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            Theo dõi ({bookmarkTotalItems})
          </Link>
          <Link
            href={buildTabHref("history")}
            className={`inline-flex flex-1 justify-center items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <Clock3 className="h-4 w-4" />
            Lịch sử ({historyTotalItems})
          </Link>
        </div>

        {activeTab === "bookmarks" ? (
          bookmarkTotalItems > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                <Badge className="bg-accent text-accent-foreground">
                  {bookmarkTotalItems} đã lưu
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Trang {bookmarkPage} trên {bookmarksTotalPages}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {bookmarkedManga.map((manga) => {
                  const removeAction = removeMangaBookmark.bind(
                    null,
                    manga.slug,
                  );

                  return (
                    <div key={manga.slug}>
                      <MangaCardApi comic={manga} />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Bắt đầu theo dõi từ{" "}
                          {formatShortDate(manga.bookmarkedAt)}
                        </p>
                        <form action={removeAction}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Xóa ${manga.name} khỏi danh sách theo dõi`}
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
                Bạn chưa theo dõi bộ truyện nào
              </h3>
              <p className="text-muted-foreground mb-4">
                Hãy theo dõi truyện để hiển thị danh sách
              </p>
              <Link href="/browse">
                <Button>Khám phá truyện mới</Button>
              </Link>
            </div>
          )
        ) : historyTotalItems > 0 ? (
          <>
            <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
              <Badge className="bg-accent text-accent-foreground">
                {historyTotalItems} manga in history
              </Badge>
              <p className="text-sm text-muted-foreground">
                Trang {historyPage} trên {historyTotalPages}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {readingHistory.map((manga) => (
                <div key={manga.slug}>
                  <MangaCardApi comic={manga} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Đọc lần cuối vào {formatShortDate(manga.latestReadAt)}
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
                        href={buildPageHref("history", bookmarkPage, pageNum)}
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
              Chưa có lịch sử đọc truyện nào
            </h3>
            <p className="text-muted-foreground mb-4">
              Hãy thưởng thức một vài bộ truyện tranh
            </p>
            <Link href="/browse">
              <Button>Khám phá truyện mới</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
