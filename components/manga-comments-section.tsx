"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";
import {
  createComment,
  getChapterComments,
  getCommentViewer,
  getMangaComments,
  type CommentFeedItem,
  type CommentViewer,
} from "@/lib/actions/comment.actions";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MangaCommentsSectionProps = {
  comicSlug: string;
  chapterName?: string;
  className?: string;
};

const getRelativeTime = (input: string) => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "just now";

  const diffMs = date.getTime() - Date.now();
  const diffAbsSeconds = Math.round(Math.abs(diffMs) / 1000);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, secondsPerUnit] of units) {
    if (diffAbsSeconds >= secondsPerUnit || unit === "second") {
      const value = Math.round(diffMs / 1000 / secondsPerUnit);
      return formatter.format(value, unit);
    }
  }

  return "just now";
};

const getViewerInitial = (viewer: CommentViewer) => {
  if (!viewer) return "U";
  const source = viewer.name || viewer.id || "U";
  return source.charAt(0).toUpperCase();
};

export function MangaCommentsSection({
  comicSlug,
  chapterName,
  className,
}: MangaCommentsSectionProps) {
  const router = useRouter();
  const [viewer, setViewer] = useState<CommentViewer>(null);
  const [comments, setComments] = useState<CommentFeedItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isChapterScope = Boolean(chapterName);

  const scopeMeta = useMemo(
    () =>
      isChapterScope
        ? {
            title: `Chapter ${chapterName} Comments`,
            subtitle: "Only comments from this chapter are shown here.",
          }
        : {
            title: "Comments",
            subtitle: "This feed combines manga comments and all chapter comments.",
          },
    [chapterName, isChapterScope],
  );

  const loadComments = useCallback(async () => {
    if (!comicSlug) {
      setComments([]);
      setViewer(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [viewerData, commentData] = await Promise.all([
        getCommentViewer(),
        isChapterScope && chapterName
          ? getChapterComments(comicSlug, chapterName)
          : getMangaComments(comicSlug),
      ]);
      setViewer(viewerData);
      setComments(commentData);
    } catch (error) {
      console.error("Failed to load comments:", error);
      toast.error("Could not load comments right now.");
    } finally {
      setIsLoading(false);
    }
  }, [chapterName, comicSlug, isChapterScope]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const content = newComment.trim();
    if (!content) {
      toast.error("Please enter a comment before posting.");
      return;
    }

    if (!viewer) {
      toast.error("Please sign in to comment.");
      router.push("/sign-in");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createComment({
        comicSlug,
        content,
        targetType: isChapterScope ? "chapter" : "manga",
        chapterName: chapterName || undefined,
      });

      if (!result.success) {
        toast.error(result.message);
        if (result.requiresSignIn) {
          router.push("/sign-in");
        }
        return;
      }

      setNewComment("");
      if (result.comment) {
        setComments((prev) => [result.comment as CommentFeedItem, ...prev]);
      } else {
        await loadComments();
      }
      toast.success(result.message);
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Could not post your comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-[linear-gradient(180deg,oklch(0.18_0.03_250),oklch(0.15_0.03_250))] p-4 shadow-lg shadow-black/15 md:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <MessageSquareText className="h-5 w-5 text-primary" />
            {scopeMeta.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{scopeMeta.subtitle}</p>
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </Badge>
      </div>

      <div className="rounded-xl border border-primary/25 bg-background/45 p-3 md:p-4">
        {viewer ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={viewer.image} alt={viewer.name} />
                <AvatarFallback>{getViewerInitial(viewer)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{viewer.name}</p>
                <p className="text-xs text-muted-foreground">Share your thoughts</p>
              </div>
            </div>

            <Textarea
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Write your comment..."
              rows={3}
              className="resize-none border-primary/20 bg-background/70 text-sm"
              maxLength={1000}
            />

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {newComment.trim().length}/1000
              </span>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !newComment.trim()}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post Comment
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              You need to sign in to leave a comment.
            </p>
            <Link href="/sign-in">
              <Button size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-border/70 bg-background/25 py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/25 py-10 text-center text-sm text-muted-foreground">
            No comments yet. Be the first to start the discussion.
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-xl border border-border/70 bg-secondary/35 p-3 md:p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="mt-0.5 h-9 w-9 border border-border">
                    <AvatarImage src={comment.userImage} alt={comment.userName} />
                    <AvatarFallback>
                      {comment.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {comment.userName}
                      </span>
                      {!isChapterScope && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/15 text-primary hover:bg-primary/15"
                        >
                          {comment.targetType === "chapter" && comment.chapterName
                            ? `Chapter ${comment.chapterName}`
                            : "Manga"}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/95">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
