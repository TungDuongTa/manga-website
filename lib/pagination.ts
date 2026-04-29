export const toPositiveInt = (value: unknown, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Math.floor(numeric);
  if (normalized <= 0) return fallback;
  return normalized;
};

export const normalizePageAndSize = (
  page: unknown,
  pageSize: unknown,
  defaultPageSize: number,
  maxPageSize: number,
): { page: number; pageSize: number } => {
  const normalizedPage = toPositiveInt(page, 1);
  const normalizedPageSize = Math.min(
    maxPageSize,
    Math.max(1, toPositiveInt(pageSize, defaultPageSize)),
  );

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
  };
};

export const getVisiblePages = (
  currentPage: number,
  totalPages: number,
  maxVisiblePages = 5,
): number[] => {
  const safeTotalPages = Math.max(1, Math.floor(totalPages));
  const safeCurrentPage = Math.min(
    Math.max(1, Math.floor(currentPage)),
    safeTotalPages,
  );
  const safeMaxVisiblePages = Math.max(1, Math.floor(maxVisiblePages));

  if (safeTotalPages <= safeMaxVisiblePages) {
    return Array.from({ length: safeTotalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(safeMaxVisiblePages / 2);
  let start = safeCurrentPage - halfWindow;
  let end = start + safeMaxVisiblePages - 1;

  if (start < 1) {
    start = 1;
    end = safeMaxVisiblePages;
  }

  if (end > safeTotalPages) {
    end = safeTotalPages;
    start = safeTotalPages - safeMaxVisiblePages + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};
