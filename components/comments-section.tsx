import Link from "next/link";
import { MessageCircle, ThumbsUp } from "lucide-react";
import type { HomeRecentCommentItem } from "@/lib/actions/comment.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import { getLevelBadgeTier, getLevelUsernameEffect } from "@/lib/level-badge-tiers";

interface CommentsSectionProps {
  comments: HomeRecentCommentItem[];
}

const getUserInitial = (name: string) => {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "U";
  return trimmed.charAt(0).toUpperCase();
};

const formatChapterLabel = (chapterName: string | null) => {
  if (!chapterName) return null;
  return chapterName.toLowerCase().startsWith("chapter")
    ? chapterName
    : `Chapter ${chapterName}`;
};

export function CommentsSection({ comments }: CommentsSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <header className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Recent Comments</h3>
      </header>

      {comments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-6 text-center text-sm text-muted-foreground">
          No recent comments yet.
        </p>
      ) : (
        <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const chapterLabel = formatChapterLabel(comment.chapterName);
            const usernameEffect = getLevelUsernameEffect(comment.userLevel);
            const levelBadgeTier = getLevelBadgeTier(comment.userLevel);

            return (
              <article
                key={comment.id}
                className="rounded-lg border border-border/60 bg-secondary/40 p-3"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={comment.userImage}
                      alt={comment.userName}
                    />
                    <AvatarFallback className="text-xs">
                      {getUserInitial(comment.userName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-semibold tracking-wide",
                            usernameEffect.className,
                          )}
                          title={`${usernameEffect.name} username effect`}
                        >
                          {comment.userName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 shrink-0 rounded-full px-1.5 text-[10px] font-semibold",
                            levelBadgeTier.className,
                          )}
                        >
                          Lv {comment.userLevel}
                        </Badge>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <Link
                        href={`/manga/${comment.comicSlug}`}
                        className="truncate font-medium text-primary hover:underline"
                      >
                        {comment.comicName}
                      </Link>
                      {chapterLabel && (
                        <Link
                          href={`/manga/${comment.comicSlug}/chapter/${encodeURIComponent(comment.chapterName || "")}`}
                          className="truncate font-medium text-rose-500 hover:text-rose-400 dark:text-rose-300 dark:hover:text-rose-200"
                        >
                          - {chapterLabel}
                        </Link>
                      )}
                    </div>

                    <p className="break-words text-sm text-muted-foreground">
                      {comment.content}
                    </p>

                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{comment.likeCount}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
