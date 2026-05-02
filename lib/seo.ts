export const SITE_NAME = "VuaTruyen";

export const SITE_DESCRIPTION =
  "Read manga, manhwa, and manhua online with daily updates, rankings, bookmarks, and chapter progress tracking.";

const FALLBACK_BASE_URL = "http://localhost:3000";

const ensureValidBaseUrl = (value: string): string => {
  const normalized = value.trim().replace(/\/+$/, "");
  if (!normalized) return FALLBACK_BASE_URL;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return FALLBACK_BASE_URL;
    }
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return FALLBACK_BASE_URL;
  }
};

export const getBaseUrl = (): URL => {
  const envBase =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.BETTER_AUTH_URL || "";
  return new URL(ensureValidBaseUrl(envBase));
};

export const toAbsoluteUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getBaseUrl()).toString();
};

export const withSiteSuffix = (title: string): string =>
  `${title} | ${SITE_NAME}`;

export const stripHtml = (value: string): string =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export const truncateText = (value: string, maxLength: number): string => {
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
};

export const buildCanonicalPath = (
  pathname: string,
  query?: Record<string, string | number | null | undefined>,
): string => {
  if (!query) return pathname;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (!normalized) continue;
    params.set(key, normalized);
  }

  const queryString = params.toString();
  if (!queryString) return pathname;
  return `${pathname}?${queryString}`;
};
