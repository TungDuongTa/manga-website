import { connectToDatabase } from "@/database/mongoose";
import { UserReadingStatsModel } from "@/database/models/user-reading-stats.model";
import { toReadingExpStats, type ReadingExpStats } from "@/lib/user-level";

const normalizeUserIds = (userIds: string[]) =>
  Array.from(
    new Set(userIds.map((id) => String(id || "").trim()).filter(Boolean)),
  );

export const incrementUserReadingStatsForNewChapter = async (
  userId: string | null | undefined,
  chapterIncrement = 1,
) => {
  const normalizedUserId = String(userId || "").trim();
  const incrementBy = Math.max(0, Math.floor(Number(chapterIncrement) || 0));
  if (!normalizedUserId || incrementBy <= 0) return;

  await connectToDatabase();

  await UserReadingStatsModel.updateOne(
    { userId: normalizedUserId },
    { $inc: { chaptersRead: incrementBy } },
    { upsert: true },
  );
};

export const getUserLevelMap = async (
  userIds: string[],
): Promise<Map<string, number>> => {
  const uniqueUserIds = normalizeUserIds(userIds);
  const levelMap = new Map<string, number>();

  if (uniqueUserIds.length === 0) {
    return levelMap;
  }

  await connectToDatabase();

  const statsRows = await UserReadingStatsModel.find({
    userId: { $in: uniqueUserIds },
  })
    .select("userId chaptersRead")
    .lean();

  const defaultLevel = toReadingExpStats(0).level;
  for (const userId of uniqueUserIds) {
    levelMap.set(userId, defaultLevel);
  }

  for (const row of statsRows as Array<{
    userId?: string;
    chaptersRead?: number;
  }>) {
    const userId = String(row.userId || "").trim();
    if (!userId) continue;

    const chaptersRead = Number(row.chaptersRead || 0);
    const stats = toReadingExpStats(chaptersRead);
    levelMap.set(userId, stats.level);
  }

  return levelMap;
};

export const getUserReadingExpStats = async (
  userId: string | null | undefined,
): Promise<ReadingExpStats> => {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    return toReadingExpStats(0);
  }

  await connectToDatabase();
  const existingStats = await UserReadingStatsModel.findOne({
    userId: normalizedUserId,
  })
    .select("chaptersRead")
    .lean();

  if (!existingStats) return toReadingExpStats(0);

  return toReadingExpStats(Number(existingStats.chaptersRead || 0));
};
