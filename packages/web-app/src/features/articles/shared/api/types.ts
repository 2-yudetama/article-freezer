import * as v from "valibot";
import { ArticleSchema } from "@/domain/articles";

/**
 * 記事 API の request / response スキーマ定義。
 * App Router で公開する API 契約を Article ドメインから切り出して扱う。
 */

/**
 * POST /api/users/[userId]/articles/extract のリクエストスキーマ。
 */
export const ArticleExtractRequestSchema = v.pick(ArticleSchema, [
  "articleSource",
]);
export type ArticleExtractRequest = v.InferOutput<
  typeof ArticleExtractRequestSchema
>;

/**
 * POST /api/users/[userId]/articles/extract のレスポンススキーマ。
 */
export const ArticleExtractResponseSchema = v.pick(ArticleSchema, [
  "articleSource",
  "title",
  "publishedDate",
  "content",
]);
export type ArticleExtractResponse = v.InferOutput<
  typeof ArticleExtractResponseSchema
>;
