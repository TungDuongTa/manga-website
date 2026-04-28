"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { MangaCommentsSection } from "@/components/manga-comments-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toggleMangaBookmark } from "@/lib/actions/bookmark.actions";
import { formatViewCount } from "@/lib/view-utils";
import {
  type ComicDetailItem,
  formatStatus,
  formatUpdatedAt,
  getImageUrl,
} from "@/types/otruyen-types";

type MangaDetailPageClientProps = {
  id: string;
  comic: ComicDetailItem;
  initialBookmarked: boolean;
  initialReadChapterNames: string[];
  initialTotalViews: number;
};

export function MangaDetailPageClient({
  id,
  comic,
  initialBookmarked,
  initialReadChapterNames,
  initialTotalViews,
}: MangaDetailPageClientProps) {
  const router = useRouter();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [chaptersOrder, setChaptersOrder] = useState<"desc" | "asc">("desc");
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  const chapters = comic.chapters?.[0]?.server_data || [];
  const sortedChapters = [...chapters].sort((a, b) => {
    const aNum = parseFloat(a.chapter_name) || 0;
    const bNum = parseFloat(b.chapter_name) || 0;
    return chaptersOrder === "desc" ? bNum - aNum : aNum - bNum;
  });

  const latestChapter =
    chapters.length > 0 ? chapters[chapters.length - 1] : null;
  const firstChapter = chapters.length > 0 ? chapters[0] : null;
  const readChapterSet = useMemo(
    () => new Set(initialReadChapterNames),
    [initialReadChapterNames],
  );

  const handleBookmarkToggle = async () => {
    if (!comic || isBookmarkLoading) return;

    setIsBookmarkLoading(true);
    try {
      const result = await toggleMangaBookmark({
        comicId: comic._id,
        slug: comic.slug,
        name: comic.name,
        thumbUrl: comic.thumb_url,
        status: comic.status,
        comicUpdatedAt: comic.updatedAt,
        categories: comic.category || [],
        latestChapterName: latestChapter?.chapter_name,
      });

      if (!result.success) {
        toast.error(result.message);
        if (result.requiresSignIn) {
          router.push("/sign-in");
        }
        return;
      }

      setIsBookmarked(result.bookmarked);
      toast.success(result.message);
    } catch (error) {
      console.error("Failed to bookmark manga:", error);
      toast.error("Could not update bookmark. Please try again.");
    } finally {
      setIsBookmarkLoading(false);
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
                  <span>{formatViewCount(initialTotalViews)} views</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>{formatUpdatedAt(comic.updatedAt)}</span>
                </span>
              </div>

              {comic.author.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">
                      Author:{" "}
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
                  <Link href={`/manga/${comic.slug}/chapter/${firstChapter.chapter_name}`}>
                    <Button size="lg" className="gap-2">
                      <Play className="h-4 w-4" />
                      Start Reading
                    </Button>
                  </Link>
                )}
                {latestChapter && (
                  <Link href={`/manga/${comic.slug}/chapter/${latestChapter.chapter_name}`}>
                    <Button size="lg" variant="outline" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Latest Chapter
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
                    ? "Saving..."
                    : isBookmarked
                      ? "Bookmarked"
                      : "Bookmark"}
                </Button>
                <Button size="lg" variant="ghost" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Synopsis</h2>
            <div
              className={`leading-relaxed text-muted-foreground ${!isDescriptionExpanded ? "line-clamp-3" : ""}`}
              dangerouslySetInnerHTML={{
                __html: comic.content || "No description available.",
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
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Read More
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
                  Chapters ({chapters.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chapters" className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Chapter List
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      setChaptersOrder(chaptersOrder === "desc" ? "asc" : "desc")
                    }
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {chaptersOrder === "desc" ? "Newest First" : "Oldest First"}
                  </Button>
                </div>

                <div className="max-h-[500px] overflow-y-auto rounded-xl border border-border bg-card">
                  {sortedChapters.map((chapterItem, index) => {
                    const isRead = readChapterSet.has(chapterItem.chapter_name);

                    return (
                      <Link
                        key={`${chapterItem.chapter_name}-${index}`}
                        href={`/manga/${comic.slug}/chapter/${chapterItem.chapter_name}`}
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
                            Read
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
            <MangaCommentsSection comicSlug={comic.slug || id} comicName={comic.name || ""} />
          </section>
        </div>
      </main>
    </div>
  );
}
