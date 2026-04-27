export const parseChapterNumber = (chapterName: string): number | null => {
  const parsed = Number.parseFloat(chapterName);
  return Number.isFinite(parsed) ? parsed : null;
};

const chapterLabelCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export const compareChapterNames = (a: string, b: string): number => {
  if (a === b) return 0;

  const aNum = parseChapterNumber(a);
  const bNum = parseChapterNumber(b);

  if (aNum !== null && bNum !== null) {
    return aNum - bNum;
  }

  if (aNum !== null) return 1;
  if (bNum !== null) return -1;

  return chapterLabelCollator.compare(a, b);
};
