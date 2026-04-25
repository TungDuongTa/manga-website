"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { CommentModel } from "@/database/models/comment.model";

export type CommentViewer = {
  id: string;
  name: string;
  image: string;
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
  createdAt: string;
};

type CreateCommentInput = {
  comicSlug: string;
  content: string;
  targetType: "manga" | "chapter";
  chapterName?: string;
};

type CreateCommentResult = {
  success: boolean;
  message: string;
  requiresSignIn?: boolean;
  comment?: CommentFeedItem;
};

const COMMENT_MAX_LENGTH = 1000;

const toFeedItem = (doc: any): CommentFeedItem => ({
  id: String(doc._id),
  userId: doc.userId,
  userName: doc.userName,
  userImage: doc.userImage || "",
  content: doc.content,
  comicSlug: doc.comicSlug,
  targetType: doc.targetType,
  chapterName: doc.chapterName || null,
  createdAt: new Date(
    doc.createdAt || doc.updatedAt || Date.now(),
  ).toISOString(),
});

const getSessionUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
};

export const getCommentViewer = async (): Promise<CommentViewer> => {
  const user = await getSessionUser();
  if (!user) return null;

  return {
    id: user.id,
    name: user.name || user.email || "User",
    image: user.image ?? "",
  };
};

export const getMangaComments = async (
  comicSlug: string,
): Promise<CommentFeedItem[]> => {
  const normalizedSlug = comicSlug.trim();
  if (!normalizedSlug) return [];

  await connectToDatabase();
  const docs = await CommentModel.find({ comicSlug: normalizedSlug })
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  return docs.map(toFeedItem);
};

export const getChapterComments = async (
  comicSlug: string,
  chapterName: string,
): Promise<CommentFeedItem[]> => {
  const normalizedSlug = comicSlug.trim();
  const normalizedChapter = chapterName.trim();
  if (!normalizedSlug || !normalizedChapter) return [];

  await connectToDatabase();
  const docs = await CommentModel.find({
    comicSlug: normalizedSlug,
    targetType: "chapter",
    chapterName: normalizedChapter,
  })
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  return docs.map(toFeedItem);
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
  const content = input.content.trim();
  const chapterName = input.chapterName?.trim() || null;

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

  if (input.targetType === "chapter" && !chapterName) {
    return {
      success: false,
      message: "Invalid chapter identifier for chapter comment.",
    };
  }

  await connectToDatabase();

  const created = await CommentModel.create({
    userId: user.id,
    userName: user.name || user.email || "User",
    userImage: user.image || "",
    comicSlug,
    targetType: input.targetType,
    chapterName: input.targetType === "chapter" ? chapterName : null,
    content,
  });

  revalidatePath(`/manga/${comicSlug}`);
  if (input.targetType === "chapter" && chapterName) {
    revalidatePath(`/manga/${comicSlug}/chapter/${chapterName}`);
  }

  return {
    success: true,
    message: "Comment posted.",
    comment: toFeedItem(created.toObject()),
  };
};
