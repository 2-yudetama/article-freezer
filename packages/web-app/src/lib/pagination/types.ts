/**
 * App Router の searchParams で受け取る query 値
 */
export type SearchParamValue = string | string[] | undefined;

/**
 * ページネーション計算に必要な入力
 */
export type PaginationParams = {
  page: number;
  perPage: number;
  totalCount: number;
};

/**
 * DB取得とUI表示で利用するページネーション情報
 */
export type Pagination = {
  currentPage: number;
  totalPages: number;
  skip: number;
  take: number;
  perPage: number;
  totalCount: number;
};
