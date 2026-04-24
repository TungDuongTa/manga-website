import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  OTruyenComic,
  getImageUrl,
  formatStatus,
  formatUpdatedAt,
} from "@/types/otruyen-types";

const FALLBACK_COVER =
  "https://placehold.co/300x450/111827/9CA3AF?text=No+Cover";

interface MangaCardApiProps {
  comic: OTruyenComic;
  showLatestChapter?: boolean;
  variant?: "default" | "compact" | "horizontal";
}

export function MangaCardApi({
  comic,
  showLatestChapter = true,
  variant = "default",
}: MangaCardApiProps) {
  const coverSrc = comic.thumb_url?.trim()
    ? getImageUrl(comic.thumb_url)
    : FALLBACK_COVER;

  const statusColors: Record<string, string> = {
    ongoing: "bg-accent text-accent-foreground",
    completed: "bg-primary text-primary-foreground",
  };

  if (variant === "horizontal") {
    return (
      <Link href={`/manga/${comic.slug}`} className="group block">
        <div className="flex gap-4 p-3 rounded-lg bg-card hover:bg-secondary transition-colors ">
          <div className="relative w-16 h-22  overflow-hidden rounded-md bg-muted">
            <Image
              src={coverSrc}
              alt={comic.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="flex-1 min-w-0 flex-col">
            <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {comic.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {formatStatus(comic.status)}
              </Badge>
            </div>
            {showLatestChapter && comic.chaptersLatest?.[0] && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Chapter {comic.chaptersLatest[0].chapter_name} -{" "}
                {formatUpdatedAt(comic.updatedAt)}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/manga/${comic.slug}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
          <Image
            src={coverSrc}
            alt={comic.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <h3 className="text-xs font-medium text-white line-clamp-1 leading-tight">
              {comic.name}
            </h3>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/manga/${comic.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-3 bg-muted">
        <Image
          src={coverSrc}
          alt={comic.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Status Badge */}
        <Badge
          className={`absolute top-2 left-2 text-xs ${statusColors[comic.status] || "bg-muted"}`}
        >
          {formatStatus(comic.status)}
        </Badge>

        {/* Categories */}
        {comic.category.length > 0 && (
          <Badge
            variant="outline"
            className="absolute top-2 right-2 text-xs border-primary text-primary bg-black/50"
          >
            {comic.category[0].name}
          </Badge>
        )}
      </div>

      <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
        {comic.name}
      </h3>

      {showLatestChapter && comic.chaptersLatest?.[0] && (
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Chapter {comic.chaptersLatest[0].chapter_name}
        </p>
      )}
    </Link>
  );
}
