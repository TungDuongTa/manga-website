"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { CommentLikeModel } from "@/database/models/comment-like.model";
import { CommentModel } from "@/database/models/comment.model";
import { normalizePageAndSize } from "@/lib/pagination";
import { getUserLevelMap } from "@/lib/server/user-level";
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

export type CommentFeedPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type CommentFeedResponse = {
  viewer: CommentViewer;
  comments: CommentFeedItem[];
  pagination: CommentFeedPagination;
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
const DEFAULT_RECENT_HOME_COMMENT_LIMIT = 10;
const MAX_RECENT_HOME_COMMENT_LIMIT = 30;
const DEFAULT_COMMENT_PAGE_SIZE = 10;
const MAX_COMMENT_PAGE_SIZE = 30;
const DEFAULT_COMMENT_AUTHOR_NAME = "User";
const AUTH_USER_COLLECTION_CANDIDATES = ["user", "users"] as const;
const TOP_LEVEL_COMMENT_QUERY = { parentCommentId: null };
const COMMENT_PROJECTION =
  "_id userId content comicSlug comicName targetType chapterName parentCommentId likeCount createdAt updatedAt";

type CommentAuthorProfile = {
  name: string;
  image: string;
};

const isDuplicateKeyError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const maybeCode = (error as { code?: unknown }).code;
  return maybeCode === 11000;
};

const buildCommentPagination = (
  page: number,
  pageSize: number,
  totalItems: number,
): CommentFeedPagination => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
};

const findAuthUsersByIds = async (
  userIds: Array<ObjectId | string>,
): Promise<Array<{ _id?: ObjectId | string; name?: string; image?: string }>> => {
  if (userIds.length === 0) return [];

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) return [];

  for (const collectionName of AUTH_USER_COLLECTION_CANDIDATES) {
    const exists = await db
      .listCollections({ name: collectionName }, { nameOnly: true })
      .hasNext();
    if (!exists) continue;

    const rows = await db
      .collection(collectionName)
      .find(
        { _id: { $in: userIds as any[] } },
        { projection: { _id: 1, name: 1, image: 1 } },
      )
      .toArray();
    if (rows.length) return rows;
  }

  return [];
};

const getCommentAuthorProfileMap = async (
  userIds: string[],
): Promise<Map<string, CommentAuthorProfile>> => {
  const normalizedUserIds = Array.from(
    new Set(userIds.map((id) => String(id || "").trim()).filter(Boolean)),
  );
  if (normalizedUserIds.length === 0) return new Map();

  const lookupIds: Array<ObjectId | string> = [];
  for (const userId of normalizedUserIds) {
    lookupIds.push(userId);
    if (ObjectId.isValid(userId)) {
      lookupIds.push(new ObjectId(userId));
    }
  }

  const rows = await findAuthUsersByIds(lookupIds);
  const profileMap = new Map<string, CommentAuthorProfile>();

  for (const row of rows) {
    const id = row?._id ? String(row._id) : "";
    if (!id) continue;
    profileMap.set(id, {
      name: String(row.name || "").trim() || DEFAULT_COMMENT_AUTHOR_NAME,
      image: String(row.image || "").trim(),
    });
  }

  return profileMap;
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
  const objectIds = uniqueCommentIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
  if (objectIds.length === 0) return new Set<string>();

  const likes = await CommentLikeModel.find({
    userId: viewerId,
    commentId: { $in: objectIds },
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
  authorProfileMap?: Map<string, CommentAuthorProfile>,
): CommentFeedItem => {
  const userId = String(doc.userId || "").trim();
  const authorProfile = authorProfileMap?.get(userId);

  return {
    id: String(doc._id),
    userId,
    userName: authorProfile?.name || DEFAULT_COMMENT_AUTHOR_NAME,
    userImage: authorProfile?.image || "",
    content: doc.content,
    comicSlug: doc.comicSlug,
    targetType: doc.targetType,
    chapterName: doc.chapterName || null,
    parentCommentId: doc.parentCommentId ? String(doc.parentCommentId) : null,
    userLevel: levelMap?.get(userId) ?? 1,
    likeCount: Number.isFinite(doc.likeCount) ? doc.likeCount : 0,
    likedByViewer:
      Boolean(viewerId) && Boolean(likedCommentIds?.has(String(doc._id))),
    createdAt: new Date(
      doc.createdAt || doc.updatedAt || Date.now(),
    ).toISOString(),
  };
};

const fetchDescendantsForParents = async (
  scopeQuery: Record<string, unknown>,
  parentIds: string[],
) => {
  const normalizedParentIds = Array.from(
    new Set(parentIds.map((id) => String(id || "").trim()).filter(Boolean)),
  );

  if (!normalizedParentIds.length) {
    return [] as any[];
  }

  const descendants: any[] = [];
  const visitedParentIds = new Set<string>();
  let currentParentIds = normalizedParentIds;

  while (currentParentIds.length > 0) {
    const batchIds = currentParentIds.filter((id) => !visitedParentIds.has(id));
    if (!batchIds.length) break;
    const parentObjectIds = batchIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (!parentObjectIds.length) break;

    batchIds.forEach((id) => visitedParentIds.add(id));

    const rows = await CommentModel.find({
      ...scopeQuery,
      parentCommentId: { $in: parentObjectIds },
    })
      .select(COMMENT_PROJECTION)
      .lean();

    if (!rows.length) break;

    descendants.push(...rows);
    currentParentIds = rows.map((row: any) => String(row._id));
  }

  return descendants;
};

const getPaginatedCommentDocs = async (
  scopeQuery: Record<string, unknown>,
  page: number,
  pageSize: number,
): Promise<{ docs: any[]; pagination: CommentFeedPagination }> => {
  const topLevelQuery = {
    ...scopeQuery,
    ...TOP_LEVEL_COMMENT_QUERY,
  };

  const totalItems = await CommentModel.countDocuments(topLevelQuery);
  const pagination = buildCommentPagination(page, pageSize, totalItems);

  if (totalItems === 0) {
    return {
      docs: [],
      pagination,
    };
  }

  const skip = (pagination.page - 1) * pagination.pageSize;
  const topLevelDocs = await CommentModel.find(topLevelQuery)
    .select(COMMENT_PROJECTION)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pagination.pageSize)
    .lean();

  const descendants = await fetchDescendantsForParents(
    scopeQuery,
    topLevelDocs.map((doc: any) => String(doc._id)),
  );

  return {
    docs: [...topLevelDocs, ...descendants],
    pagination,
  };
};

const buildCommentFeed = async (
  scopeQuery: Record<string, unknown>,
  page: number,
  pageSize: number,
): Promise<CommentFeedResponse> => {
  const user = await getSessionUser();

  await connectToDatabase();
  const { docs, pagination } = await getPaginatedCommentDocs(
    scopeQuery,
    page,
    pageSize,
  );

  const commentIds = docs.map((doc: any) => String(doc._id));
  const userIds = Array.from(
    new Set(
      [...docs.map((doc: any) => String(doc.userId || "")), user?.id || ""]
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
  const [likedCommentIds, levelMap, authorProfileMap] = await Promise.all([
    getViewerLikedCommentIdSet(user?.id, commentIds),
    getUserLevelMap(userIds),
    getCommentAuthorProfileMap(userIds),
  ]);

  return {
    viewer: toCommentViewer(user, levelMap),
    comments: docs.map((doc: any) =>
      toFeedItem(doc, user?.id, likedCommentIds, levelMap, authorProfileMap),
    ),
    pagination,
  };
};

export const getCommentViewer = async (): Promise<CommentViewer> => {
  const user = await getSessionUser();
  if (!user) return null;
  const levelMap = await getUserLevelMap([user.id]);

  return toCommentViewer(user, levelMap);
};

const toCommentViewer = (
  user: Awaited<ReturnType<typeof getSessionUser>>,
  levelMap: Map<string, number>,
): CommentViewer => {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name || user.email || "User",
    image: user.image ?? "",
    level: levelMap.get(user.id) ?? 1,
  };
};

export const getMangaComments = async (
  comicSlug: string,
  page = 1,
  pageSize = DEFAULT_COMMENT_PAGE_SIZE,
): Promise<CommentFeedResponse> => {
  const normalizedSlug = comicSlug.trim();
  const normalizedPagination = normalizePageAndSize(
    page,
    pageSize,
    DEFAULT_COMMENT_PAGE_SIZE,
    MAX_COMMENT_PAGE_SIZE,
  );

  if (!normalizedSlug) {
    return {
      viewer: null,
      comments: [],
      pagination: buildCommentPagination(
        normalizedPagination.page,
        normalizedPagination.pageSize,
        0,
      ),
    };
  }

  return buildCommentFeed(
    { comicSlug: normalizedSlug },
    normalizedPagination.page,
    normalizedPagination.pageSize,
  );
};

export const getChapterComments = async (
  comicSlug: string,
  chapterName: string,
  page = 1,
  pageSize = DEFAULT_COMMENT_PAGE_SIZE,
): Promise<CommentFeedResponse> => {
  const normalizedSlug = comicSlug.trim();
  const normalizedChapter = chapterName.trim();
  const normalizedPagination = normalizePageAndSize(
    page,
    pageSize,
    DEFAULT_COMMENT_PAGE_SIZE,
    MAX_COMMENT_PAGE_SIZE,
  );

  if (!normalizedSlug || !normalizedChapter) {
    return {
      viewer: null,
      comments: [],
      pagination: buildCommentPagination(
        normalizedPagination.page,
        normalizedPagination.pageSize,
        0,
      ),
    };
  }

  return buildCommentFeed(
    {
      comicSlug: normalizedSlug,
      targetType: "chapter",
      chapterName: normalizedChapter,
    },
    normalizedPagination.page,
    normalizedPagination.pageSize,
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

    const userIds = docs.map((doc: any) => String(doc.userId || ""));
    const [levelMap, authorProfileMap] = await Promise.all([
      getUserLevelMap(userIds),
      getCommentAuthorProfileMap(userIds),
    ]);

    return docs.map((doc: any) => {
      const comicSlug = String(doc.comicSlug || "").trim();
      const storedComicName = String(doc.comicName || "").trim();
      const userId = String(doc.userId || "").trim();
      const comicName = storedComicName || comicSlug || "Unknown Manga";
      const authorProfile = authorProfileMap.get(userId);

      return {
        id: String(doc._id),
        userName: authorProfile?.name || DEFAULT_COMMENT_AUTHOR_NAME,
        userImage: authorProfile?.image || "",
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
  let normalizedParentCommentId: Types.ObjectId | null = null;
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
    const parentObjectId = new Types.ObjectId(parentCommentId);

    const parent = await CommentModel.findOne({
      _id: parentObjectId,
      comicSlug,
    })
      .select("_id comicName targetType chapterName")
      .lean();

    if (!parent) {
      return { success: false, message: "Parent comment not found." };
    }

    resolvedTargetType = parent.targetType;
    resolvedChapterName = parent.chapterName || null;
    normalizedParentCommentId = new Types.ObjectId(String(parent._id));
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
    comicSlug,
    comicName: resolvedComicName,
    targetType: resolvedTargetType,
    chapterName: resolvedChapterName,
    parentCommentId: normalizedParentCommentId,
    content,
    likeCount: 0,
  });
  const levelMap = await getUserLevelMap([user.id]);
  revalidatePath(`/manga/${comicSlug}`);
  revalidatePath("/");
  if (resolvedTargetType === "chapter" && resolvedChapterName) {
    revalidatePath(`/manga/${comicSlug}/chapter/${resolvedChapterName}`);
  }

  return {
    success: true,
    message: "Comment posted.",
    comment: toFeedItem(
      created.toObject(),
      user.id,
      new Set<string>(),
      levelMap,
      new Map<string, CommentAuthorProfile>([
        [
          user.id,
          {
            name:
              String(user.name || user.email || "").trim() ||
              DEFAULT_COMMENT_AUTHOR_NAME,
            image: String(user.image || "").trim(),
          },
        ],
      ]),
    ),
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
  const commentObjectId = new Types.ObjectId(normalizedId);

  await connectToDatabase();
  const existing = await CommentModel.findById(commentObjectId)
    .select("_id comicSlug targetType chapterName")
    .lean();

  if (!existing) {
    return { success: false, message: "Comment not found." };
  }

  const removedLike = await CommentLikeModel.findOneAndDelete({
    commentId: commentObjectId,
    userId: user.id,
  })
    .select("_id")
    .lean();

  let likedByViewer = false;
  let updatedLikeCount: number | null = null;

  if (removedLike) {
    const updatedComment = await CommentModel.findOneAndUpdate(
      { _id: commentObjectId },
      { $inc: { likeCount: -1 } },
      {
        returnDocument: "after",
        projection: { likeCount: 1 },
        lean: true,
      },
    );

    updatedLikeCount = Number(updatedComment?.likeCount ?? 0);
    likedByViewer = false;
  } else {
    let createdLike = false;
    try {
      await CommentLikeModel.create({
        commentId: commentObjectId,
        userId: user.id,
      });
      createdLike = true;
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
    }

    if (createdLike) {
      const updatedComment = await CommentModel.findOneAndUpdate(
        { _id: commentObjectId },
        { $inc: { likeCount: 1 } },
        {
          returnDocument: "after",
          projection: { likeCount: 1 },
          lean: true,
        },
      );

      updatedLikeCount = Number(updatedComment?.likeCount ?? 0);
      likedByViewer = true;
    } else {
      // Duplicate key means the like already exists (race-safe no-op on count).
      const commentDoc = await CommentModel.findById(commentObjectId)
        .select("likeCount")
        .lean();
      updatedLikeCount = Number(commentDoc?.likeCount ?? 0);
      likedByViewer = true;
    }
  }

  const safeLikeCount = Math.max(0, Math.floor(updatedLikeCount ?? 0));
  if (safeLikeCount === 0) {
    await CommentModel.updateOne(
      { _id: commentObjectId, likeCount: { $lt: 0 } },
      { $set: { likeCount: 0 } },
    );
  }

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
    liked: likedByViewer,
    likeCount: safeLikeCount,
  };
};
