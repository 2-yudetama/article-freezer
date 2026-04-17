import * as v from "valibot";
import { ArticleSchema, ArticleTagSchema } from "@/domain/articles";
import type { ArticleListSortOption } from "./constants";

/**
 * 記事一覧表示機能関連の型定義
 * - Valibotスキーマ + 型定義
 */

/**
 * 記事一覧のタグ表示で利用するタグ情報のスキーマ
 * 既存の ArticleTag ドメインから一覧表示に必要な項目だけを切り出して再利用する
 */
export const ArticleListTagSchema = v.pick(ArticleTagSchema, [
  "tagId",
  "name",
  "color",
]);
export type ArticleListTag = v.InferOutput<typeof ArticleListTagSchema>;

/**
 * 記事一覧で表示する記事情報のスキーマ
 * 既存の Article ドメインから一覧表示に必要な項目だけを切り出して再利用する
 */
export const ArticleListItemSchema = v.pick(ArticleSchema, [
  "articleId",
  "articleSource",
  "title",
  "publishedDate",
  "content",
  "createdAt",
  "isFavorite",
  "tags",
]);
export type ArticleListItem = v.InferOutput<typeof ArticleListItemSchema>;

/**
 * 記事一覧の表示条件として扱う検索パラメータ
 */
export type ArticleListSearchParams = {
  page: number;
  sortOption: ArticleListSortOption;
  selectedTagIds: string[];
};
