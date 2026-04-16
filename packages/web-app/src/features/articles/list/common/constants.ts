/**
 * 記事一覧で扱う表示形式の選択肢
 */
export type ArticleListViewMode = "grid" | "list";

/**
 * 記事一覧で扱う並び順の選択肢
 */
export type ArticleListSortOption = "newest" | "oldest" | "title";

/**
 * ソート設定とUI表示名のマッピング
 */
export const ARTICLE_LIST_SORT_OPTIONS = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
  { value: "title", label: "タイトル順" },
] as const satisfies {
  value: ArticleListSortOption;
  label: string;
}[];
