import {
  parsePageParam,
  toArrayParam,
  toFirstParam,
} from "@/lib/pagination/query";
import type { SearchParamValue } from "@/lib/pagination/types";
import {
  ARTICLE_LIST_SORT_OPTIONS,
  type ArticleListSortOption,
} from "./constants";
import type { ArticleListSearchParams } from "./types";

/**
 * App Router から受け取る記事一覧ページの searchParams
 */
export type ArticleListPageSearchParams = {
  page?: SearchParamValue;
  sort?: SearchParamValue;
  tag?: SearchParamValue;
};

/**
 * 記事一覧の searchParams を表示条件に変換する
 */
export function parseArticleListSearchParams({
  page,
  sort,
  tag,
}: ArticleListPageSearchParams): ArticleListSearchParams {
  const isArticleListSortOption = (
    option: string | undefined,
  ): option is ArticleListSortOption =>
    ARTICLE_LIST_SORT_OPTIONS.some(({ value }) => value === option);

  const parseSortOption = (value: SearchParamValue): ArticleListSortOption => {
    const sortOption = toFirstParam(value);

    if (isArticleListSortOption(sortOption)) {
      return sortOption;
    }

    return "newest";
  };

  return {
    page: parsePageParam(page),
    sortOption: parseSortOption(sort),
    selectedTagIds: toArrayParam(tag),
  };
}
