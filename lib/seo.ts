export const SITE_NAME = "VuaTruyen";

export const SITE_DESCRIPTION =
  "Đọc truyện tranh manga, manhwa và manhua online, được cập nhật hằng ngày, có bảng xếp hạng, theo dõi và tiến độ đọc.";

const FALLBACK_BASE_URL = "https://vuatruyen.vercel.app";

const normalizeBaseUrlInput = (value: string): string => {
  const normalized = value.trim().replace(/\/+$/, "");
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized}`;
};

const parseBaseUrl = (value: string): URL | null => {
  const normalized = normalizeBaseUrlInput(value);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const getBaseUrl = (): URL => {
  const candidates = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const parsed = parseBaseUrl(candidate || "");
    if (!parsed) continue;

    // Prefer non-localhost URLs in production when multiple values are present.
    if (
      process.env.NODE_ENV === "production" &&
      parsed.hostname === "localhost"
    ) {
      continue;
    }

    return new URL(parsed.toString().replace(/\/+$/, ""));
  }

  return new URL(FALLBACK_BASE_URL);
};

export const toAbsoluteUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getBaseUrl()).toString();
};

export const withSiteSuffix = (title: string): string =>
  `${title} | ${SITE_NAME}`;

export const stripHtml = (value: string): string =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
