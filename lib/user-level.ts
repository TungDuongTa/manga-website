export type ReadingExpStats = {
  chaptersRead: number;
  totalExp: number;
  level: number;
  currentLevelExp: number;
  expToNextLevel: number;
  progressPercent: number;
  maxLevel: number;
};

export const MAX_USER_LEVEL = 100;
export const EXP_PER_CHAPTER = 1;
export const EXP_PER_LEVEL = 100;

export const toReadingExpStats = (chaptersRead: number): ReadingExpStats => {
  const chapterCount = Math.max(0, Math.floor(Number(chaptersRead) || 0));
  const totalExp = chapterCount * EXP_PER_CHAPTER;
  const rawLevel = Math.floor(totalExp / EXP_PER_LEVEL) + 1;
  const level = Math.min(MAX_USER_LEVEL, rawLevel);

  if (level >= MAX_USER_LEVEL) {
    return {
      chaptersRead: chapterCount,
      totalExp,
      level: MAX_USER_LEVEL,
      currentLevelExp: EXP_PER_LEVEL,
      expToNextLevel: 0,
      progressPercent: 100,
      maxLevel: MAX_USER_LEVEL,
    };
  }

  const currentLevelExp = totalExp % EXP_PER_LEVEL;
  const expToNextLevel = EXP_PER_LEVEL - currentLevelExp;
  const progressPercent = (currentLevelExp / EXP_PER_LEVEL) * 100;

  return {
    chaptersRead: chapterCount,
    totalExp,
    level,
    currentLevelExp,
    expToNextLevel,
    progressPercent,
    maxLevel: MAX_USER_LEVEL,
  };
};
