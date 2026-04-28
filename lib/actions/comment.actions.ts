"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { CommentLikeModel } from "@/database/models/comment-like.model";
import { CommentModel } from "@/database/models/comment.model";
import { ReadChapterModel } from "@/database/models/read-chapter.model";
import { getSessionUser } from "@/lib/server-session";

export type CommentViewer = {
  id: string;
  name: string;
  image: string;
  level: number;
} | null;

export type CommentFeedItem = {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  content: string;
  comicSlug: string;
  targetType: "manga" | "chapter";
  chapterName: string | null;
  parentCommentId: string | null;
  userLevel: number;
  likeCount: number;
  likedByViewer: boolean;
  createdAt: string;
};

export type HomeRecentCommentItem = {
  id: string;
  userName: string;
  userImage: string;
  userLevel: number;
  content: string;
  comicSlug: string;
  comicName: string;
  chapterName: string | null;
  likeCount: number;
  createdAt: string;
};

type CreateCommentInput = {
  comicSlug: string;
  comicName?: string;
  content: string;
  targetType?: "manga" | "chapter";
  chapterName?: string;
  parentCommentId?: string;
};

type CreateCommentResult = {
  success: boolean;
  message: string;
  requiresSignIn?: boolean;
  comment?: CommentFeedItem;
};

type ToggleCommentLikeResult = {
  success: boolean;
  message: string;
  requiresSignIn?: boolean;
  liked?: boolean;
  likeCount?: number;
};

const COMMENT_MAX_LENGTH = 1000;
const MAX_LEVEL = 100;
const EXP_PER_LEVEL = 100;
const DEFAULT_RECENT_HOME_COMMENT_LIMIT = 10;
const MAX_RECENT_HOME_COMMENT_LIMIT = 30;
const TOP_LEVEL_COMMENT_QUERY = {
  $or: [
    { parentCommentId: null },
    { parentCommentId: { $exists: false } },
    { parentCommentId: "" },
  ],
};
const COMMENT_PROJECTION =
  "_id userId userName userImage content comicSlug comicName targetType chapterName parentCommentId likeCount createdAt updatedAt";

const isDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const maybeCode = (error as { code?: unknown }).code;
  return maybeCode === 11000;
};

const toLevel = (chaptersRead: number) => {
  const safeCount = Math.max(0, chaptersRead);
  const rawLevel = Math.floor(safeCount / EXP_PER_LEVEL) + 1;
  return Math.min(MAX_LEVEL, rawLevel);
};

const getUserLevelMap = async (
  userIds: string[],
): Promise<Map<string, number>> => {
  const uniqueUserIds = Array.from(
    new Set(userIds.map((id) => String(id || "").trim()).filter(Boolean)),
  );
  const levelMap = new Map<string, number>();

  if (uniqueUserIds.length === 0) {
    return levelMap;
  }

  await connectToDatabase();

  const rows = await ReadChapterModel.aggregate([
    { $match: { userId: { $in: uniqueUserIds } } },
    { $group: { _id: "$userId", chaptersRead: { $sum: 1 } } },
  ]);

  for (const userId of uniqueUserIds) {
    levelMap.set(userId, 1);
  }

  for (const row of rows as Array<{ _id: string; chaptersRead: number }>) {
    levelMap.set(String(row._id), toLevel(Number(row.chaptersRead || 0)));
  }

  return levelMap;
};

const getViewerLikedCommentIdSet = async (
  viewerId: string | null | undefined,
  commentIds: string[],
): Promise<Set<string>> => {
  if (!viewerId) return new Set<string>();

  const uniqueCommentIds = Array.from(
    new Set(commentIds.map((id) => String(id || "").trim()).filter(Boolean)),
  );
  if (uniqueCommentIds.length === 0) return new Set<string>();

  const likes = await CommentLikeModel.find({
    userId: viewerId,
    commentId: { $in: uniqueCommentIds },
  })
    .select("commentId")
    .lean();

  return new Set(likes.map((like: any) => String(like.commentId)));
};

const toFeedItem = (
  doc: any,
  viewerId?: string | null,
  likedCommentIds?: Set<string>,
  levelMap?: Map<string, number>,
): CommentFeedItem => ({
  id: String(doc._id),
  userId: doc.userId,
  userName: doc.userName,
  userImage: doc.userImage || "",
  content: doc.content,
  comicSlug: doc.comicSlug,
  targetType: doc.targetType,
  chapterName: doc.chapterName || null,
  parentCommentId: doc.parentCommentId ? String(doc.parentCommentId) : null,
  userLevel: levelMap?.get(String(doc.userId)) ?? 1,
  likeCount: Number.isFinite(doc.likeCount) ? doc.likeCount : 0,
  likedByViewer:
    Boolean(viewerId) && Boolean(likedCommentIds?.has(String(doc._id))),
  createdAt: new Date(
    doc.createdAt || doc.updatedAt || Date.now(),
  ).toISOString(),
});

const fetchCommentsWithAncestors = async (query: Record<string, unknown>) => {
  const baseDocs = await CommentModel.find(query)
    .select(COMMENT_PROJECTION)
    .sort({ createdAt: -1 })
    .lean();

  const byId = new Map<string, any>();
  const missingAncestorIds = new Set<string>();

  for (const doc of baseDocs) {
    byId.set(String(doc._id), doc);
  }

  for (const doc of baseDocs) {
    const parentId = doc.parentCommentId ? String(doc.parentCommentId) : null;
    if (parentId && !byId.has(parentId) && Types.ObjectId.isValid(parentId)) {
      missingAncestorIds.add(parentId);
    }
  }

  const visited = new Set<string>();
  while (missingAncestorIds.size > 0) {
    const batchIds = Array.from(missingAncestorIds).filter(
      (id) => !visited.has(id),
    );
    missingAncestorIds.clear();
    if (batchIds.length === 0) break;

    batchIds.forEach((id) => visited.add(id));

    const ancestorDocs = await CommentModel.find({
      _id: { $in: batchIds },
      comicSlug: query.comicSlug,
    })
      .select(COMMENT_PROJECTION)
      .lean();

    for (const doc of ancestorDocs) {
      const id = String(doc._id);
      if (!byId.has(id)) {
        byId.set(id, doc);
      }

      const parentId = doc.parentCommentId ? String(doc.parentCommentId) : null;
      if (
        parentId &&
        !byId.has(parentId) &&
        !visited.has(parentId) &&
        Types.ObjectId.isValid(parentId)
      ) {
        missingAncestorIds.add(parentId);
      }
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.createdAt || b.updatedAt || 0).getTime() -
      new Date(a.createdAt || a.updatedAt || 0).getTime(),
  );
};

export const getCommentViewer = async (): Promise<CommentViewer> => {
  const user = await getSessionUser();
  if (!user) return null;
  const levelMap = await getUserLevelMap([user.id]);

  return {
    id: user.id,
    name: user.name || user.email || "User",
    image: user.image ?? "",
    level: levelMap.get(user.id) ?? 1,
  };
};

export const getMangaComments = async (
  comicSlug: string,
): Promise<CommentFeedItem[]> => {
  const normalizedSlug = comicSlug.trim();
  if (!normalizedSlug) return [];
  const user = await getSessionUser();

  await connectToDatabase();
  const docs = await fetchCommentsWithAncestors({ comicSlug: normalizedSlug });
  const likedCommentIds = await getViewerLikedCommentIdSet(
    user?.id,
    docs.map((doc: any) => String(doc._id)),
  );
  const levelMap = await getUserLevelMap(docs.map((doc: any) => doc.userId));

  return docs.map((doc: any) =>
    toFeedItem(doc, user?.id, likedCommentIds, levelMap),
  );
};

export const getChapterComments = async (
  comicSlug: string,
  chapterName: string,
): Promise<CommentFeedItem[]> => {
  const normalizedSlug = comicSlug.trim();
  const normalizedChapter = chapterName.trim();
  if (!normalizedSlug || !normalizedChapter) return [];
  const user = await getSessionUser();

  await connectToDatabase();
  const docs = await fetchCommentsWithAncestors({
    comicSlug: normalizedSlug,
    targetType: "chapter",
    chapterName: normalizedChapter,
  });
  const likedCommentIds = await getViewerLikedCommentIdSet(
    user?.id,
    docs.map((doc: any) => String(doc._id)),
  );
  const levelMap = await getUserLevelMap(docs.map((doc: any) => doc.userId));

  return docs.map((doc: any) =>
    toFeedItem(doc, user?.id, likedCommentIds, levelMap),
  );
};

export const getRecentTopLevelComments = async (
  limit = DEFAULT_RECENT_HOME_COMMENT_LIMIT,
): Promise<HomeRecentCommentItem[]> => {
  const normalizedLimit = Number.isFinite(limit) ? Math.floor(limit) : 0;
  const safeLimit = Math.min(
    MAX_RECENT_HOME_COMMENT_LIMIT,
    Math.max(1, normalizedLimit || DEFAULT_RECENT_HOME_COMMENT_LIMIT),
  );

  try {
    await connectToDatabase();

    const docs = await CommentModel.find(TOP_LEVEL_COMMENT_QUERY)
      .select(COMMENT_PROJECTION)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();

    const levelMap = await getUserLevelMap(
      docs.map((doc: any) => String(doc.userId || "")),
    );

    return docs.map((doc: any) => {
      const comicSlug = String(doc.comicSlug || "").trim();
      const storedComicName = String(doc.comicName || "").trim();
      const userId = String(doc.userId || "").trim();
      const comicName = storedComicName || comicSlug || "Unknown Manga";

      return {
        id: String(doc._id),
        userName: doc.userName || "User",
        userImage: doc.userImage || "",
        userLevel: levelMap.get(userId) ?? 1,
        content: doc.content || "",
        comicSlug,
        comicName,
        chapterName: doc.chapterName || null,
        likeCount: Number.isFinite(doc.likeCount) ? doc.likeCount : 0,
        createdAt: new Date(
          doc.createdAt || doc.updatedAt || Date.now(),
        ).toISOString(),
      };
    });
  } catch (error) {
    console.error("Failed to load recent top-level comments:", error);
    return [];
  }
};

export const createComment = async (
  input: CreateCommentInput,
): Promise<CreateCommentResult> => {
  const user = await getSessionUser();
  if (!user) {
    return {
      success: false,
      message: "Please sign in to comment.",
      requiresSignIn: true,
    };
  }

  const comicSlug = input.comicSlug.trim();
  const comicName = input.comicName?.trim() || "";
  const content = input.content.trim();
  const chapterName = input.chapterName?.trim() || null;
  const parentCommentId = input.parentCommentId?.trim() || null;
  let normalizedParentCommentId: string | null = null;
  let resolvedComicName = comicName || comicSlug;

  if (!comicSlug) {
    return { success: false, message: "Invalid manga identifier." };
  }

  if (!content) {
    return { success: false, message: "Comment cannot be empty." };
  }

  if (content.length > COMMENT_MAX_LENGTH) {
    return {
      success: false,
      message: `Comment must be ${COMMENT_MAX_LENGTH} characters or less.`,
    };
  }

  await connectToDatabase();
  let resolvedTargetType: "manga" | "chapter" = "manga";
  let resolvedChapterName: string | null = null;

  if (parentCommentId) {
    if (!Types.ObjectId.isValid(parentCommentId)) {
      return { success: false, message: "Invalid parent comment." };
    }

    const parent = await CommentModel.findOne({
      _id: parentCommentId,
      comicSlug,
    })
      .select("_id comicSlug comicName targetType chapterName parentCommentId")
      .lean();

    if (!parent) {
      return { success: false, message: "Parent comment not found." };
    }

    resolvedTargetType = parent.targetType;
    resolvedChapterName = parent.chapterName || null;
    normalizedParentCommentId = String(parent._id);
    resolvedComicName =
      String(parent.comicName || "").trim() || resolvedComicName;
  } else {
    if (!input.targetType) {
      return { success: false, message: "Missing comment target." };
    }
    resolvedTargetType = input.targetType;

    if (resolvedTargetType === "chapter" && !chapterName) {
      return {
        success: false,
        message: "Invalid chapter identifier for chapter comment.",
      };
    }

    resolvedChapterName = resolvedTargetType === "chapter" ? chapterName : null;
  }

  const created = await CommentModel.create({
    userId: user.id,
    userName: user.name || user.email || "User",
    userImage: user.image || "",
    comicSlug,
    comicName: resolvedComicName,
    targetType: resolvedTargetType,
    chapterName: resolvedChapterName,
    parentCommentId: normalizedParentCommentId,
    content,
    likeCount: 0,
  });

  // Safety write: if a stale dev-cached schema is active, create() can drop
  // unknown paths. Force parentCommentId into storage with strict: false.
  if (normalizedParentCommentId) {
    await CommentModel.updateOne(
      { _id: created._id },
      { $set: { parentCommentId: normalizedParentCommentId } },
      { strict: false },
    );
  }

  const createdFromDb = await CommentModel.findById(created._id)
    .select(COMMENT_PROJECTION)
    .lean();
  const levelMap = await getUserLevelMap([user.id]);

  revalidatePath(`/manga/${comicSlug}`);
  revalidatePath("/");
  if (resolvedTargetType === "chapter" && resolvedChapterName) {
    revalidatePath(`/manga/${comicSlug}/chapter/${resolvedChapterName}`);
  }

  return {
    success: true,
    message: "Comment posted.",
    comment: {
      ...toFeedItem(
        createdFromDb || created.toObject(),
        user.id,
        new Set<string>(),
        levelMap,
      ),
      parentCommentId: normalizedParentCommentId,
    },
  };
};

export const toggleCommentLike = async (
  commentId: string,
): Promise<ToggleCommentLikeResult> => {
  const user = await getSessionUser();
  if (!user) {
    return {
      success: false,
      message: "Please sign in to like comments.",
      requiresSignIn: true,
    };
  }

  const normalizedId = commentId.trim();
  if (!Types.ObjectId.isValid(normalizedId)) {
    return { success: false, message: "Invalid comment identifier." };
  }

  await connectToDatabase();
  const existing = await CommentModel.findById(normalizedId)
    .select("_id comicSlug targetType chapterName")
    .lean();

  if (!existing) {
    return { success: false, message: "Comment not found." };
  }

  const removedLike = await CommentLikeModel.findOneAndDelete({
    commentId: normalizedId,
    userId: user.id,
  })
    .select("_id")
    .lean();

  if (!removedLike) {
    try {
      await CommentLikeModel.create({
        commentId: normalizedId,
        userId: user.id,
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
    }
  }

  const [likeCount, likedByViewer] = await Promise.all([
    CommentLikeModel.countDocuments({ commentId: normalizedId }),
    CommentLikeModel.exists({ commentId: normalizedId, userId: user.id }),
  ]);

  await CommentModel.updateOne(
    { _id: normalizedId },
    { $set: { likeCount: Math.max(0, likeCount) } },
  );

  revalidatePath(`/manga/${existing.comicSlug}`);
  revalidatePath("/");
  if (existing.targetType === "chapter" && existing.chapterName) {
    revalidatePath(
      `/manga/${existing.comicSlug}/chapter/${existing.chapterName}`,
    );
  }

  return {
    success: true,
    message: likedByViewer ? "Liked comment." : "Like removed.",
    liked: Boolean(likedByViewer),
    likeCount: Math.max(0, likeCount),
  };
};
