"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, TrendingUp, Clock, Flame, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/types/otruyen-types";
import {
  getMangaRankings,
  type MangaRankingItem,
  type MangaRankingPeriod,
} from "@/lib/actions/manga-view.actions";
import { formatViewCount } from "@/lib/view-utils";

const FALLBACK_COVER =
  "https://placehold.co/200x300/111827/9CA3AF?text=No+Cover";

interface RankingSidebarApiProps {
  limit?: number;
}

const getMedalClassName = (index: number) => {
  if (index === 0) return "bg-chart-3 text-background";
  if (index === 1) return "bg-gray-400 text-background";
  if (index === 2) return "bg-amber-700 text-background";
  return "bg-secondary text-muted-foreground";
};

const periodTabs: Array<{
  key: MangaRankingPeriod;
  label: string;
  Icon: typeof Flame;
}> = [
  { key: "daily", label: "Daily", Icon: Flame },
  { key: "weekly", label: "Weekly", Icon: TrendingUp },
  { key: "monthly", label: "Monthly", Icon: Clock },
  { key: "allTime", label: "All Time", Icon: Trophy },
];

export function RankingSidebarApi({ limit = 10 }: RankingSidebarApiProps) {
  const [activeTab, setActiveTab] = useState<MangaRankingPeriod>("daily");
  const [rankings, setRankings] = useState<
    Record<MangaRankingPeriod, MangaRankingItem[]>
  >({
    daily: [],
    weekly: [],
    monthly: [],
    allTime: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRankings = async () => {
      setIsLoading(true);
      try {
        const data = await getMangaRankings(limit);
        if (!mounted) return;
        setRankings(data);
      } catch (error) {
        console.error("Failed to fetch rankings:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRankings();

    return () => {
      mounted = false;
    };
  }, [limit]);

  const rankedComics = rankings[activeTab] || [];

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-chart-3" />
        <h3 className="text-lg font-semibold text-foreground">Rankings</h3>
      </div>

      <div className="grid grid-cols-2 gap-1 mb-4 bg-secondary/50 p-1 rounded-lg">
        {periodTabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md transition-colors ${
              activeTab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : rankedComics.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No view data yet.
          </div>
        ) : (
          rankedComics.map((comic, index) => (
            <Link
              key={`${activeTab}-${comic._id}`}
              href={`/manga/${comic.slug}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getMedalClassName(index)}`}
              >
                {index + 1}
              </div>

              <div className="relative w-10 h-14 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={
                    comic.thumb_url?.trim()
                      ? getImageUrl(comic.thumb_url)
                      : FALLBACK_COVER
                  }
                  alt={comic.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {comic.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatViewCount(
                    activeTab === "allTime"
                      ? comic.totalViews || 0
                      : comic.periodViews || 0,
                  )}{" "}
                  {activeTab === "allTime" ? "all-time" : activeTab} views
                </p>
                {activeTab !== "allTime" && (
                  <p className="text-[11px] text-muted-foreground/80">
                    {formatViewCount(comic.totalViews || 0)} total views
                  </p>
                )}

                {comic.category.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs mt-1 border-border/50"
                  >
                    {comic.category[0].name}
                  </Badge>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
