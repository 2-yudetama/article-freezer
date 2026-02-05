export type ArticleTag = {
  id: string;
  name: string;
  description?: string;
  color?: string;
};

export type Article = {
  id: string;
  title: string;
  url: string;
  summary: string;
  comment: string;
  tags: ArticleTag[];
  publishedAt: string;
  createdAt: string;
  sourcePlatform: "zenn" | "qiita" | "note" | "other";
  isFavorite: boolean;
};

export type ViewMode = "grid" | "list";

export type SortOption = "newest" | "oldest" | "title";

export type RegistrationStep =
  | "url"
  | "headings"
  | "tags-comment"
  | "summary"
  | "confirm";
