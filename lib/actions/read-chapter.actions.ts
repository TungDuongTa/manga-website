"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { ReadChapterModel } from "@/database/models/read-chapter.model";

type MarkChapterAsReadInput = {
  comicId?: string;
  comicSlug: string;
  comicName?: string;
  chapterName: string;
};

type MarkChapterAsReadResult = {
  success: boolean;
  requiresSignIn?: boolean;
};

const getCurrentUserId = async (): Promise<string | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user?.id ?? null;
};

export const getReadChapterNames = async (
  comicSlug: string,
): Promise<string[]> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }

  await connectToDatabase();
  const rows = await ReadChapterModel.find({
    userId,
    comicSlug,
  })
    .sort({ readAt: -1 })
    .select("chapterName -_id")
    .lean();

  return rows.map((row: any) => row.chapterName).filter(Boolean);
};

export const markChapterAsRead = async (
  input: MarkChapterAsReadInput,
): Promise<MarkChapterAsReadResult> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, requiresSignIn: true };
  }

  await connectToDatabase();

  await ReadChapterModel.updateOne(
    {
      userId,
      comicSlug: input.comicSlug,
      chapterName: input.chapterName,
    },
    {
      $set: {
        comicId: input.comicId || "",
        comicName: input.comicName || "",
        readAt: new Date(),
      },
    },
    { upsert: true },
  );

  revalidatePath(`/manga/${input.comicSlug}`);

  return { success: true };
};
