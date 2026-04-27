"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CornerDownRight,
  Loader2,
  LogIn,
  MessageSquareText,
  Send,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  createComment,
  getChapterComments,
  getCommentViewer,
  getMangaComments,
  toggleCommentLike,
  type CommentFeedItem,
  type CommentViewer,
} from "@/lib/actions/comment.actions";
import { getLevelBadgeTier, getLevelUsernameEffect } from "@/lib/level-badge-tiers";
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

const sortNewestFirst = (a: CommentFeedItem, b: CommentFeedItem) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const sortOldestFirst = (a: CommentFeedItem, b: CommentFeedItem) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

const normalizeComment = (comment: CommentFeedItem): CommentFeedItem => ({
  ...comment,
  id: String(comment.id),
  parentCommentId: comment.parentCommentId ? String(comment.parentCommentId) : null,
});

const resolveThreadRootId = (
  comment: CommentFeedItem,
  byId: Map<string, CommentFeedItem>,
) => {
  let cursor = comment;
  const visited = new Set<string>();

  while (cursor.parentCommentId) {
    if (visited.has(cursor.parentCommentId)) break;
    visited.add(cursor.parentCommentId);

    const parent = byId.get(cursor.parentCommentId);
    if (!parent) return cursor.parentCommentId;
    if (!parent.parentCommentId) return parent.id;
    cursor = parent;
  }

  return comment.id;
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
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [collapsedReplyThreads, setCollapsedReplyThreads] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingReplyTo, setSubmittingReplyTo] = useState<string | null>(
    null,
  );
  const [likingCommentIds, setLikingCommentIds] = useState<Set<string>>(
    new Set(),
  );

  const isChapterScope = Boolean(chapterName);
  const viewerUsernameEffect = viewer ? getLevelUsernameEffect(viewer.level) : null;

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

  const commentsById = useMemo(
    () => new Map(comments.map((comment) => [comment.id, comment])),
    [comments],
  );

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, CommentFeedItem[]>();
    for (const comment of comments) {
      if (!comment.parentCommentId) continue;
      const current = map.get(comment.parentCommentId) || [];
      current.push(comment);
      map.set(comment.parentCommentId, current);
    }

    for (const [key, value] of map.entries()) {
      map.set(key, value.sort(sortOldestFirst));
    }

    return map;
  }, [comments]);

  const rootComments = useMemo(
    () => comments.filter((comment) => !comment.parentCommentId).sort(sortNewestFirst),
    [comments],
  );

  const descendantCountById = useMemo(() => {
    const memo = new Map<string, number>();

    const countChildren = (parentId: string): number => {
      if (memo.has(parentId)) return memo.get(parentId) || 0;

      const children = childrenByParentId.get(parentId) || [];
      let total = children.length;

      for (const child of children) {
        total += countChildren(child.id);
      }

      memo.set(parentId, total);
      return total;
    };

    const result = new Map<string, number>();
    for (const comment of comments) {
      result.set(comment.id, countChildren(comment.id));
    }
    return result;
  }, [childrenByParentId, comments]);

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
      setComments(commentData.map(normalizeComment));
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

  const setThreadExpanded = (rootId: string, expanded: boolean) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (expanded) next.add(rootId);
      else next.delete(rootId);
      return next;
    });
  };

  const setChildThreadExpanded = (commentId: string, expanded: boolean) => {
    setCollapsedReplyThreads((prev) => {
      const next = new Set(prev);
      if (expanded) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const getRootIdForComment = (comment: CommentFeedItem) =>
    resolveThreadRootId(comment, commentsById);

  const handleStartReply = (comment: CommentFeedItem) => {
    if (!viewer) {
      toast.error("Please sign in to reply.");
      router.push("/sign-in");
      return;
    }

    const rootId = getRootIdForComment(comment);
    setActiveReplyId(comment.id);
    setThreadExpanded(rootId, true);
  };

  const handleSubmitRootComment = async () => {
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
        if (result.requiresSignIn) router.push("/sign-in");
        return;
      }

      setNewComment("");
      if (result.comment) {
        setComments((prev) => [
          normalizeComment(result.comment as CommentFeedItem),
          ...prev,
        ]);
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

  const handleReplySubmit = async (targetComment: CommentFeedItem) => {
    if (!viewer) {
      toast.error("Please sign in to reply.");
      router.push("/sign-in");
      return;
    }

    const draft = (replyDrafts[targetComment.id] || "").trim();
    if (!draft) {
      toast.error("Please enter a reply before posting.");
      return;
    }

    const rootId = getRootIdForComment(targetComment);
    setSubmittingReplyTo(targetComment.id);
    try {
      const result = await createComment({
        comicSlug,
        content: draft,
        parentCommentId: targetComment.id,
      });

      if (!result.success) {
        toast.error(result.message);
        if (result.requiresSignIn) router.push("/sign-in");
        return;
      }

      setReplyDrafts((prev) => ({ ...prev, [targetComment.id]: "" }));
      setActiveReplyId(null);
      setThreadExpanded(rootId, true);

      if (result.comment) {
        const normalizedReply = normalizeComment(result.comment as CommentFeedItem);
        const safeReply = normalizedReply.parentCommentId
          ? normalizedReply
          : { ...normalizedReply, parentCommentId: targetComment.id };
        setComments((prev) => [...prev, safeReply]);
      } else {
        await loadComments();
      }
      toast.success(result.message);
    } catch (error) {
      console.error("Failed to reply to comment:", error);
      toast.error("Could not post your reply. Please try again.");
    } finally {
      setSubmittingReplyTo(null);
    }
  };

  const handleToggleLike = async (comment: CommentFeedItem) => {
    if (!viewer) {
      toast.error("Please sign in to like comments.");
      router.push("/sign-in");
      return;
    }

    if (likingCommentIds.has(comment.id)) return;

    const optimisticLiked = !comment.likedByViewer;
    const optimisticLikeCount = Math.max(
      0,
      comment.likeCount + (optimisticLiked ? 1 : -1),
    );

    setLikingCommentIds((prev) => new Set(prev).add(comment.id));
    setComments((prev) =>
      prev.map((item) =>
        item.id === comment.id
          ? {
              ...item,
              likedByViewer: optimisticLiked,
              likeCount: optimisticLikeCount,
            }
          : item,
      ),
    );

    try {
      const result = await toggleCommentLike(comment.id);
      if (!result.success) {
        setComments((prev) =>
          prev.map((item) =>
            item.id === comment.id
              ? {
                  ...item,
                  likedByViewer: comment.likedByViewer,
                  likeCount: comment.likeCount,
                }
              : item,
          ),
        );
        toast.error(result.message);
        if (result.requiresSignIn) router.push("/sign-in");
        return;
      }

      setComments((prev) =>
        prev.map((item) =>
          item.id === comment.id
            ? {
                ...item,
                likedByViewer:
                  typeof result.liked === "boolean"
                    ? result.liked
                    : item.likedByViewer,
                likeCount:
                  typeof result.likeCount === "number"
                    ? result.likeCount
                    : item.likeCount,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
      setComments((prev) =>
        prev.map((item) =>
          item.id === comment.id
            ? {
                ...item,
                likedByViewer: comment.likedByViewer,
                likeCount: comment.likeCount,
              }
            : item,
        ),
      );
      toast.error("Could not update like right now.");
    } finally {
      setLikingCommentIds((prev) => {
        const next = new Set(prev);
        next.delete(comment.id);
        return next;
      });
    }
  };

  const renderReplyComposer = (targetComment: CommentFeedItem, nested = false) => {
    if (activeReplyId !== targetComment.id) return null;

    const draft = replyDrafts[targetComment.id] || "";
    const isReplySubmitting = submittingReplyTo === targetComment.id;

    return (
      <div
        className={cn(
          "mt-2 rounded-lg border border-border/70 bg-background/45 p-3",
          nested ? "ml-10" : "ml-11",
        )}
      >
        <Textarea
          value={draft}
          onChange={(event) =>
            setReplyDrafts((prev) => ({
              ...prev,
              [targetComment.id]: event.target.value,
            }))
          }
          placeholder={`Reply to ${targetComment.userName}...`}
          rows={2}
          maxLength={1000}
          className="resize-none border-primary/20 bg-background/70 text-sm"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{draft.trim().length}/1000</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveReplyId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              disabled={isReplySubmitting || !draft.trim()}
              onClick={() => handleReplySubmit(targetComment)}
            >
              {isReplySubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Reply
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderCommentRow = (comment: CommentFeedItem, nested = false) => {
    const usernameEffect = getLevelUsernameEffect(comment.userLevel);

    return (
      <div
        className={cn(
          "flex items-start gap-3",
          nested && "rounded-lg border border-border/55 bg-background/30 p-3",
        )}
      >
        <Avatar className={cn("mt-0.5 border border-border", nested ? "h-8 w-8" : "h-9 w-9")}>
          <AvatarImage src={comment.userImage} alt={comment.userName} />
          <AvatarFallback>{comment.userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-sm font-semibold tracking-wide",
                usernameEffect.className,
              )}
              title={`${usernameEffect.name} username effect`}
            >
              {comment.userName}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "h-5 rounded-full px-1.5 text-[10px] font-semibold",
                getLevelBadgeTier(comment.userLevel).className,
              )}
            >
              Lv {comment.userLevel}
            </Badge>
            {comment.chapterName && (
              <Badge
                variant="secondary"
                className="bg-primary/15 text-primary hover:bg-primary/15"
              >
                Chapter {comment.chapterName}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {getRelativeTime(comment.createdAt)}
            </span>
          </div>

          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/95">
            {comment.content}
          </p>

          <div className="mt-1.5 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 gap-1.5 px-2 text-xs",
                comment.likedByViewer && "text-primary",
              )}
              disabled={likingCommentIds.has(comment.id)}
              onClick={() => handleToggleLike(comment)}
            >
              <ThumbsUp
                className={cn("h-3.5 w-3.5", comment.likedByViewer && "fill-current")}
              />
              {comment.likeCount}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={() => handleStartReply(comment)}
            >
              <CornerDownRight className="h-3.5 w-3.5" />
              Reply
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderChildren = (parentId: string, depth = 1) => {
    const children = childrenByParentId.get(parentId) || [];
    if (children.length === 0) return null;

    return (
      <div className={cn("space-y-2", depth > 1 && "ml-6")}>
        {children.map((child) => {
          const hasGrandchildren = (childrenByParentId.get(child.id) || []).length > 0;
          const grandChildCount = hasGrandchildren
            ? descendantCountById.get(child.id) ||
              (childrenByParentId.get(child.id) || []).length
            : 0;
          const isChildExpanded = !collapsedReplyThreads.has(child.id);

          return (
            <div key={child.id} className="relative">
              <span className="absolute -left-4 top-4 h-px w-4 bg-border/60" />
              {renderCommentRow(child, true)}
              {renderReplyComposer(child, true)}

              {hasGrandchildren && (
                <div className="ml-10 mt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-primary hover:text-primary"
                    onClick={() =>
                      setChildThreadExpanded(child.id, !isChildExpanded)
                    }
                  >
                    <CornerDownRight className="mr-1 h-3.5 w-3.5" />
                    {isChildExpanded
                      ? "Hide replies"
                      : `View replies (${grandChildCount})`}
                  </Button>
                </div>
              )}

              {hasGrandchildren && isChildExpanded && (
                <div className="relative ml-4 mt-2 pl-4">
                  <span className="absolute bottom-0 left-0 top-0 w-px bg-border/60" />
                  {renderChildren(child.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm font-semibold tracking-wide",
                      viewerUsernameEffect?.className,
                    )}
                    title={
                      viewerUsernameEffect
                        ? `${viewerUsernameEffect.name} username effect`
                        : undefined
                    }
                  >
                    {viewer.name}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 rounded-full px-1.5 text-[10px] font-semibold",
                      getLevelBadgeTier(viewer.level).className,
                    )}
                  >
                    Lv {viewer.level}
                  </Badge>
                </div>
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
                onClick={handleSubmitRootComment}
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
        ) : rootComments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/25 py-10 text-center text-sm text-muted-foreground">
            No comments yet. Be the first to start the discussion.
          </div>
        ) : (
          <div className="space-y-4">
            {rootComments.map((parent) => {
              const totalReplies = descendantCountById.get(parent.id) || 0;
              const isExpanded = expandedThreads.has(parent.id);

              return (
                <article
                  key={parent.id}
                  className="rounded-xl border border-border/70 bg-secondary/35 p-4"
                >
                  {renderCommentRow(parent)}
                  {renderReplyComposer(parent)}

                  {totalReplies > 0 && (
                    <div className="ml-11 mt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-primary hover:text-primary"
                        onClick={() => setThreadExpanded(parent.id, !isExpanded)}
                      >
                        <CornerDownRight className="mr-1 h-3.5 w-3.5" />
                        {isExpanded
                          ? "Hide replies"
                          : `View replies (${totalReplies})`}
                      </Button>
                    </div>
                  )}

                  {isExpanded && totalReplies > 0 && (
                    <div className="relative ml-11 mt-2 pl-4">
                      <span className="absolute bottom-0 left-0 top-0 w-px bg-border/60" />
                      {renderChildren(parent.id)}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
