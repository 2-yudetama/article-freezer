import type { Pagination, PaginationParams } from "./types";

/**
 * DB取得に利用するページネーション情報を計算する
 */
export function getPagination({
  page,
  perPage,
  totalCount,
}: PaginationParams): Pagination {
  const totalPages = Math.ceil(totalCount / perPage);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  return {
    currentPage,
    totalPages,
    skip: (currentPage - 1) * perPage,
    take: perPage,
    perPage,
    totalCount,
  };
}
