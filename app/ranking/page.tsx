import Link from "next/link";
import { Trophy, Flame, TrendingUp, Clock } from "lucide-react";
import { MangaCardApi } from "@/components/manga-card-api";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getMangaRankings,
  type MangaRankingPeriod,
} from "@/lib/actions/manga-view.actions";
import { getVisiblePages } from "@/lib/pagination";
import { formatViewCount } from "@/lib/view-utils";
import { cn } from "@/lib/utils";

const MAX_ITEMS_PER_TAB = 120;
const ITEMS_PER_PAGE = 24;

const RANKING_TABS: Array<{
  key: MangaRankingPeriod;
  label: string;
  Icon: typeof Flame;
}> = [
  { key: "daily", label: "Daily", Icon: Flame },
  { key: "weekly", label: "Weekly", Icon: TrendingUp },
  { key: "monthly", label: "Monthly", Icon: Clock },
  { key: "allTime", label: "All Time", Icon: Trophy },
];

interface RankingPageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
  }>;
}

const isRankingPeriod = (value: string): value is MangaRankingPeriod =>
  RANKING_TABS.some((tab) => tab.key === value);

const buildRankingUrl = (tab: MangaRankingPeriod, page: number) => {
  const params = new URLSearchParams();
  params.set("tab", tab);

  if (page > 1) {
    params.set("page", page.toString());
  }

  return `/ranking?${params.toString()}`;
};

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const params = await searchParams;
  const activeTab =
    params.tab && isRankingPeriod(params.tab) ? params.tab : "daily";

  const requestedPage = Number.parseInt(params.page || "1", 10);
  const rankings = await getMangaRankings(MAX_ITEMS_PER_TAB);
  const rankedComics = rankings[activeTab].slice(0, MAX_ITEMS_PER_TAB);

  const totalPages = Math.max(1, Math.ceil(rankedComics.length / ITEMS_PER_PAGE));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(1, requestedPage), totalPages)
    : 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageComics = rankedComics.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const visiblePages = getVisiblePages(currentPage, totalPages, 7);
  const showStartEllipsis = visiblePages.length > 0 && visiblePages[0] > 2;
  const showEndEllipsis =
    visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < totalPages - 1;

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-chart-3" />
            <h1 className="text-3xl font-bold text-foreground">Manga Rankings</h1>
          </div>
          <p className="text-muted-foreground">
            Top viewed manga by day, week, month, and all-time.
          </p>
        </section>

        <section className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/70 p-2">
          {RANKING_TABS.map(({ key, label, Icon }) => (
            <Link
              key={key}
              href={buildRankingUrl(key, 1)}
              aria-current={activeTab === key ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeTab === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </section>

        {rankedComics.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-card/60 py-16 text-center text-muted-foreground">
            No ranking data yet for this period.
          </div>
        ) : (
          <>
            <section className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{startIndex + pageComics.length} of{" "}
                {rankedComics.length} manga
              </p>
              <Badge variant="outline" className="font-medium">
                Page {currentPage} of {totalPages}
              </Badge>
            </section>

            <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 md:gap-6">
              {pageComics.map((comic, index) => {
                const rank = startIndex + index + 1;
                const views = formatViewCount(
                  activeTab === "allTime"
                    ? comic.totalViews || 0
                    : comic.periodViews || 0,
                );

                return (
                  <article key={`${activeTab}-${comic._id}-${rank}`}>
                    <MangaCardApi comic={comic} showLatestChapter={false} />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Badge
                        variant={rank <= 3 ? "default" : "outline"}
                        className="text-xs"
                      >
                        #{rank}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{views} views</p>
                    </div>
                  </article>
                );
              })}
            </section>

            {totalPages > 1 && (
              <section className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={buildRankingUrl(activeTab, Math.max(1, currentPage - 1))}
                        aria-disabled={currentPage === 1}
                        className={cn(
                          currentPage === 1 && "pointer-events-none opacity-50",
                        )}
                      />
                    </PaginationItem>

                    {visiblePages.length > 0 && visiblePages[0] > 1 && (
                      <PaginationItem>
                        <PaginationLink href={buildRankingUrl(activeTab, 1)}>
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    {showStartEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {visiblePages.map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href={buildRankingUrl(activeTab, page)}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    {showEndEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    {visiblePages.length > 0 &&
                      visiblePages[visiblePages.length - 1] < totalPages && (
                        <PaginationItem>
                          <PaginationLink
                            href={buildRankingUrl(activeTab, totalPages)}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                    <PaginationItem>
                      <PaginationNext
                        href={buildRankingUrl(
                          activeTab,
                          Math.min(totalPages, currentPage + 1),
                        )}
                        aria-disabled={currentPage === totalPages}
                        className={cn(
                          currentPage === totalPages &&
                            "pointer-events-none opacity-50",
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
