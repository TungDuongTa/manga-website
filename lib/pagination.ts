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
