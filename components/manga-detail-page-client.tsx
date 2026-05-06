"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Heart,
  Play,
  Share2,
  User,
} from "lucide-react";
import { MangaCommentsSection } from "@/components/manga-comments-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookmarkToggle } from "@/hooks/use-bookmark-toggle";
import { formatRelativeTime } from "@/lib/date-time";
import { formatViewCount } from "@/lib/view-utils";
import { toast } from "sonner";
import {
  type ComicDetailItem,
  formatStatus,
  getImageUrl,
} from "@/types/otruyen-types";

type MangaDetailPageClientProps = {
  id: string;
  comic: ComicDetailItem;
  initialBookmarked: boolean;
  initialReadChapterNames: string[];
  initialTotalViews: number;
  routeBase?: string;
};

export function MangaDetailPageClient({
  id,
  comic,
  initialBookmarked,
  initialReadChapterNames,
  initialTotalViews,
  routeBase = "/manga",
}: MangaDetailPageClientProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [chaptersOrder, setChaptersOrder] = useState<"desc" | "asc">("desc");
  const [isSharing, setIsSharing] = useState(false);

  const chapters = comic.chapters?.[0]?.server_data || [];
  const sortedChapters = useMemo(
    () => (chaptersOrder === "desc" ? [...chapters].reverse() : [...chapters]),
    [chapters, chaptersOrder],
  );

  const latestChapter =
    chapters.length > 0 ? chapters[chapters.length - 1] : null;
  const firstChapter = chapters.length > 0 ? chapters[0] : null;
  const readChapterSet = useMemo(
    () => new Set(initialReadChapterNames),
    [initialReadChapterNames],
  );
  const comicHref = `${routeBase}/${comic.slug}`;
  const { isBookmarked, isBookmarkLoading, handleBookmarkToggle } =
    useBookmarkToggle({
      initialBookmarked,
      comicId: comic._id,
      slug: comic.slug,
      name: comic.name,
      thumbUrl: comic.thumb_url,
      status: comic.status,
      comicUpdatedAt: comic.updatedAt,
      categories: comic.category || [],
      latestChapterName: latestChapter?.chapter_name,
      routeBase,
    });

  const handleShare = async () => {
    if (isSharing) return;

    const shareUrl = window.location.href;
    const shareData = {
      title: comic.name,
      text: `Đọc truyện tranh ${comic.name} tại VuaTruyen`,
      url: shareUrl,
    };

    setIsSharing(true);

    try {
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Đã sao chép liên kết truyện");
        return;
      }

      toast.error("Không thể chia sẽ truyện lúc này.");
    } catch {
      toast.error("Không thể chia sẽ truyện lúc này.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <main>
        <div className="relative h-64 overflow-hidden md:h-80">
          <Image
            src={getImageUrl(comic.thumb_url)}
            alt={comic.name}
            fill
            sizes="100vw"
            className="scale-110 object-cover blur-sm"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto -mt-40 max-w-7xl px-4">
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="shrink-0">
              <div className="relative mx-auto aspect-[3/4] w-48 overflow-hidden rounded-xl bg-muted shadow-2xl shadow-primary/20 md:mx-0 md:w-56">
                <Image
                  src={getImageUrl(comic.thumb_url)}
                  alt={comic.name}
                  fill
                  sizes="(max-width: 768px) 192px, 224px"
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            </div>

            <div className="flex-1 pt-4 md:pt-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground">
                  {formatStatus(comic.status)}
                </Badge>
              </div>

              <h1 className="mb-2 text-balance text-3xl font-bold text-foreground md:text-4xl">
                {comic.name}
              </h1>

              {comic.origin_name.length > 0 && (
                <p className="mb-4 text-muted-foreground">
                  {comic.origin_name.join(", ")}
                </p>
              )}

              <div className="mb-6 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-5 w-5" />
                  <span>{chapters.length} chapters</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-5 w-5" />
                  <span>{formatViewCount(initialTotalViews)} lượt xem</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>{formatRelativeTime(comic.updatedAt)}</span>
                </span>
              </div>

              {comic.author.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">
                      Tác giả:{" "}
                      <span className="font-medium text-foreground">
                        {comic.author.join(", ")}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-6 flex flex-wrap gap-2">
                {comic.category.map((cat) => (
                  <Link key={cat.id} href={`/browse?genres=${cat.slug}`}>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                    >
                      {cat.name}
                    </Badge>
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {firstChapter && (
                  <Link
                    href={`${comicHref}/chapter/${firstChapter.chapter_name}`}
                  >
                    <Button size="lg" className="gap-2">
                      <Play className="h-4 w-4" />
                      Đọc từ đầu
                    </Button>
                  </Link>
                )}
                {latestChapter && (
                  <Link
                    href={`${comicHref}/chapter/${latestChapter.chapter_name}`}
                  >
                    <Button size="lg" variant="outline" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Chapter mới nhất
                    </Button>
                  </Link>
                )}
                <Button
                  size="lg"
                  variant={isBookmarked ? "default" : "outline"}
                  className="gap-2"
                  onClick={handleBookmarkToggle}
                  disabled={isBookmarkLoading}
                >
                  <Heart
                    className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`}
                  />
                  {isBookmarkLoading
                    ? "Đang lưu vào theo dõi..."
                    : isBookmarked
                      ? "Đã theo dõi"
                      : "Theo dõi"}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="gap-2"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  <Share2 className="h-4 w-4" />
                  {isSharing ? "\u0110ang chia s\u1EBB..." : "Chia s\u1EBB"}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Giới thiệu
            </h2>
            <div
              className={`leading-relaxed text-muted-foreground ${!isDescriptionExpanded ? "line-clamp-3" : ""}`}
              dangerouslySetInnerHTML={{
                __html: comic.content || "Chưa có mô tả",
              }}
            />
            {comic.content && comic.content.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-primary"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {isDescriptionExpanded ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Xem thêm
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="mt-8">
            <Tabs defaultValue="chapters">
              <TabsList className="h-auto w-full flex-wrap justify-start rounded-xl border border-border bg-card p-1">
                <TabsTrigger value="chapters" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Tổng số chapter: {chapters.length}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chapters" className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Danh sách chapter
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      setChaptersOrder(
                        chaptersOrder === "desc" ? "asc" : "desc",
                      )
                    }
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {chaptersOrder === "desc" ? "Mới nhất" : "Cũ nhất"}
                  </Button>
                </div>

                <div className="max-h-[500px] overflow-y-auto rounded-xl border border-border bg-card">
                  {sortedChapters.map((chapterItem, index) => {
                    const isRead = readChapterSet.has(chapterItem.chapter_name);

                    return (
                      <Link
                        key={`${chapterItem.chapter_name}-${index}`}
                        href={`${comicHref}/chapter/${chapterItem.chapter_name}`}
                        className={`flex items-center justify-between border-b border-border p-4 transition-colors last:border-b-0 first:rounded-t-xl last:rounded-b-xl ${
                          isRead
                            ? "bg-primary/5 hover:bg-primary/10"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`font-medium ${
                              isRead ? "text-primary" : "text-foreground"
                            }`}
                          >
                            Chapter {chapterItem.chapter_name}
                          </span>
                          {chapterItem.chapter_title && (
                            <span className="hidden text-sm text-muted-foreground sm:inline">
                              {chapterItem.chapter_title}
                            </span>
                          )}
                        </div>

                        {isRead && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Đã đọc
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <section className="mt-8">
            <MangaCommentsSection
              comicSlug={comic.slug || id}
              comicName={comic.name || ""}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
