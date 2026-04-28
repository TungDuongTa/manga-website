import { connectToDatabase } from "@/database/mongoose";
import { ReadingProgressModel } from "@/database/models/reading-progress.model";
import { UserReadingStatsModel } from "@/database/models/user-reading-stats.model";
import {
  EXP_PER_CHAPTER,
  EXP_PER_LEVEL,
  MAX_USER_LEVEL,
  toReadingExpStats,
  type ReadingExpStats,
} from "@/lib/user-level";

const normalizeUserIds = (userIds: string[]) =>
  Array.from(
    new Set(userIds.map((id) => String(id || "").trim()).filter(Boolean)),
  );

const chaptersReadCountProjection = {
  $cond: [
    { $isArray: "$readChapters" },
    { $size: "$readChapters" },
    0,
  ],
};

const toStatsDocument = (chaptersRead: number) => {
  const stats = toReadingExpStats(chaptersRead);
  return {
    chaptersRead: stats.chaptersRead,
    totalExp: stats.totalExp,
    level: stats.level,
  };
};

const persistUserStats = async (userId: string, chaptersRead: number) => {
  const doc = toStatsDocument(chaptersRead);
  await UserReadingStatsModel.updateOne(
    { userId },
    { $set: doc },
    { upsert: true },
  );
  return toReadingExpStats(chaptersRead);
};

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
    { upsert: true, setDefaultsOnInsert: true },
  );

  const safeChaptersReadExpr = { $max: [0, "$chaptersRead"] };
  await UserReadingStatsModel.updateOne(
    { userId: normalizedUserId },
    [
      {
        $set: {
          chaptersRead: safeChaptersReadExpr,
          totalExp: {
            $multiply: [safeChaptersReadExpr, EXP_PER_CHAPTER],
          },
          level: {
            $min: [
              MAX_USER_LEVEL,
              {
                $add: [
                  1,
                  {
                    $floor: {
                      $divide: [
                        {
                          $multiply: [safeChaptersReadExpr, EXP_PER_CHAPTER],
                        },
                        EXP_PER_LEVEL,
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    ] as any,
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
    .select("userId chaptersRead totalExp level")
    .lean();

  for (const userId of uniqueUserIds) {
    levelMap.set(userId, toReadingExpStats(0).level);
  }

  const existingUserIds = new Set<string>();
  const staleFixes: Array<{ userId: string; chaptersRead: number }> = [];

  for (const row of statsRows as Array<{
    userId: string;
    chaptersRead: number;
    totalExp?: number;
    level?: number;
  }>) {
    const userId = String(row.userId || "").trim();
    if (!userId) continue;
    existingUserIds.add(userId);

    const chaptersRead = Number(row.chaptersRead || 0);
    const stats = toReadingExpStats(chaptersRead);
    levelMap.set(userId, stats.level);

    if (row.totalExp !== stats.totalExp || row.level !== stats.level) {
      staleFixes.push({ userId, chaptersRead });
    }
  }

  if (staleFixes.length > 0) {
    await UserReadingStatsModel.bulkWrite(
      staleFixes.map((item) => ({
        updateOne: {
          filter: { userId: item.userId },
          update: { $set: toStatsDocument(item.chaptersRead) },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  const missingUserIds = uniqueUserIds.filter((id) => !existingUserIds.has(id));
  if (missingUserIds.length === 0) {
    return levelMap;
  }

  const fallbackRows = await ReadingProgressModel.aggregate([
    { $match: { userId: { $in: missingUserIds } } },
    {
      $project: {
        userId: 1,
        chaptersReadCount: chaptersReadCountProjection,
      },
    },
    { $group: { _id: "$userId", chaptersRead: { $sum: "$chaptersReadCount" } } },
  ]);

  const fallbackCountMap = new Map<string, number>();
  for (const row of fallbackRows as Array<{ _id: string; chaptersRead: number }>) {
    fallbackCountMap.set(String(row._id), Number(row.chaptersRead || 0));
  }

  const backfillOps = [];
  for (const userId of missingUserIds) {
    const chaptersRead = fallbackCountMap.get(userId) || 0;
    const stats = toReadingExpStats(chaptersRead);
    levelMap.set(userId, stats.level);

    backfillOps.push({
      updateOne: {
        filter: { userId },
        update: { $set: toStatsDocument(chaptersRead) },
        upsert: true,
      },
    });
  }

  if (backfillOps.length > 0) {
    await UserReadingStatsModel.bulkWrite(backfillOps, { ordered: false });
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
    .select("chaptersRead totalExp level")
    .lean();

  if (existingStats) {
    const stats = toReadingExpStats(Number(existingStats.chaptersRead || 0));
    if (
      existingStats.totalExp !== stats.totalExp ||
      existingStats.level !== stats.level
    ) {
      await UserReadingStatsModel.updateOne(
        { userId: normalizedUserId },
        { $set: toStatsDocument(Number(existingStats.chaptersRead || 0)) },
      );
    }
    return stats;
  }

  const [row] = await ReadingProgressModel.aggregate([
    { $match: { userId: normalizedUserId } },
    {
      $project: {
        chaptersReadCount: chaptersReadCountProjection,
      },
    },
    { $group: { _id: null, chaptersRead: { $sum: "$chaptersReadCount" } } },
  ]);
  const chaptersRead = Number((row as { chaptersRead?: number } | undefined)?.chaptersRead || 0);
  return persistUserStats(normalizedUserId, chaptersRead);
};
