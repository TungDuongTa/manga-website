"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, TrendingUp, Clock, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OTruyenComic, getImageUrl } from "@/types/otruyen-types";

interface RankingSidebarApiProps {
  comics: OTruyenComic[];
}

export function RankingSidebarApi({ comics }: RankingSidebarApiProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );

  // In a real app, you'd have different rankings for each period
  // For now, we'll just use the same list with different slices
  const getRankedComics = () => {
    switch (activeTab) {
      case "daily":
        return comics.slice(0, 5);
      case "weekly":
        return comics.slice(2, 7);
      case "monthly":
        return comics.slice(4, 9);
      default:
        return comics.slice(0, 5);
    }
  };

  const rankedComics = getRankedComics();

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-chart-3" />
        <h3 className="text-lg font-semibold text-foreground">Rankings</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-secondary/50 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("daily")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
            activeTab === "daily"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          Daily
        </button>
        <button
          onClick={() => setActiveTab("weekly")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
            activeTab === "weekly"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Weekly
        </button>
        <button
          onClick={() => setActiveTab("monthly")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
            activeTab === "monthly"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Monthly
        </button>
      </div>

      {/* Ranking List */}
      <div className="space-y-3">
        {rankedComics.map((comic, index) => (
          <Link
            key={comic._id}
            href={`/manga/${comic.slug}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors group"
          >
            {/* Rank Number */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                index === 0
                  ? "bg-chart-3 text-background"
                  : index === 1
                    ? "bg-gray-400 text-background"
                    : index === 2
                      ? "bg-amber-700 text-background"
                      : "bg-secondary text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>

            {/* Cover */}
            <div className="relative w-10 h-14 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image
                src={getImageUrl(comic.thumb_url)}
                alt={comic.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {comic.name}
              </h4>
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
        ))}
      </div>
    </div>
  );
}
