import Link from "next/link";
import Image from "next/image";
import { Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Manga } from "@/lib/manga-data";

interface MangaCardProps {
  manga: Manga;
  showLatestChapter?: boolean;
  variant?: "default" | "compact" | "horizontal";
}

export function MangaCard({
  manga,
  showLatestChapter = true,
  variant = "default",
}: MangaCardProps) {
  const statusColors = {
    Ongoing: "bg-accent text-accent-foreground",
    Completed: "bg-primary text-primary-foreground",
    Hiatus: "bg-muted text-muted-foreground",
  };

  const typeColors = {
    Manga: "border-chart-5 text-chart-5",
    Manhwa: "border-primary text-primary",
    Manhua: "border-accent text-accent",
  };

  if (variant === "horizontal") {
    return (
      <Link href={`/manga/${manga.id}`} className="group block">
        <div className="flex gap-4 p-3 rounded-lg bg-card hover:bg-secondary transition-colors">
          <div className="relative w-16 h-22 shrink-0 overflow-hidden rounded-md">
            <Image
              src={manga.cover}
              alt={manga.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {manga.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={`text-xs ${typeColors[manga.type]}`}
              >
                {manga.type}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-chart-3 text-chart-3" />
                {manga.rating}
              </span>
            </div>
            {showLatestChapter && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {manga.latestChapter} - {manga.lastUpdated}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/manga/${manga.id}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
          <Image
            src={manga.cover}
            alt={manga.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <h3 className="text-xs font-medium text-white line-clamp-1 leading-tight">
              {manga.title}
            </h3>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/manga/${manga.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-3">
        <Image
          src={manga.cover}
          alt={manga.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Status Badge */}
        <Badge
          className={`absolute top-2 left-2 text-xs ${statusColors[manga.status]}`}
        >
          {manga.status}
        </Badge>

        {/* Type Badge */}
        <Badge
          variant="outline"
          className={`absolute top-2 right-2 text-xs border ${typeColors[manga.type]} bg-black/50`}
        >
          {manga.type}
        </Badge>

        {/* Rating */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md">
          <Star className="h-3 w-3 fill-chart-3 text-chart-3" />
          <span className="text-xs font-medium text-white">{manga.rating}</span>
        </div>
      </div>

      <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
        {manga.title}
      </h3>

      {showLatestChapter && (
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {manga.latestChapter}
        </p>
      )}
    </Link>
  );
}
