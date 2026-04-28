const RELATIVE_TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
];

export const formatRelativeTime = (
  input: string,
  locale: string = "en",
): string => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "just now";

  const diffMs = date.getTime() - Date.now();
  const diffAbsSeconds = Math.round(Math.abs(diffMs) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unit, secondsPerUnit] of RELATIVE_TIME_UNITS) {
    if (diffAbsSeconds >= secondsPerUnit || unit === "second") {
      const value = Math.round(diffMs / 1000 / secondsPerUnit);
      return formatter.format(value, unit);
    }
  }

  return "just now";
};

export const formatShortDate = (
  dateString: string,
  locale: string = "en-US",
): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

