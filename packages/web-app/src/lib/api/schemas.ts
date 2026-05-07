import * as v from "valibot";
import { ArticleCommentSchema, ArticleSchema } from "@/domain/articles";

/**
 * API の request / response スキーマ定義
 * App Router で公開する API 契約をドメインから切り出して扱う
 */

/**
 * POST /api/users/[userId]/articles/extract のリクエストスキーマ
 */
export const ArticleExtractRequestSchema = v.pick(ArticleSchema, [
  "articleSource",
]);
export type ArticleExtractRequest = v.InferOutput<
  typeof ArticleExtractRequestSchema
>;

/**
 * POST /api/users/[userId]/articles/extract のレスポンススキーマ
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

/**
 * POST /api/users/[userId]/articles/registration のリクエストスキーマ
 */
export const ArticleRegistrationRequestSchema = v.object({
  article: v.pick(ArticleSchema, [
    "articleSource",
    "title",
    "publishedDate",
    "content",
  ]),
  comment: v.optional(v.pick(ArticleCommentSchema, ["comment"])),
  selectedTagIds: v.pipe(
    v.array(v.string()),
    v.check(
      (tagIds) => new Set(tagIds).size === tagIds.length,
      "タグが重複しています",
    ),
  ),
});
export type ArticleRegistrationRequest = v.InferOutput<
  typeof ArticleRegistrationRequestSchema
>;

/**
 * POST /api/users/[userId]/articles/registration のレスポンススキーマ
 */
export const ArticleRegistrationResponseSchema = ArticleSchema;
export type ArticleRegistrationResponse = v.InferOutput<
  typeof ArticleRegistrationResponseSchema
>;

/**
 * POST /api/users/[userId]/articles/[articleId]/comment のリクエストスキーマ
 */
export const ArticleCommentSaveRequestSchema = v.pick(ArticleCommentSchema, [
  "comment",
]);
export type ArticleCommentSaveRequest = v.InferOutput<
  typeof ArticleCommentSaveRequestSchema
>;

/**
 * POST /api/users/[userId]/articles/[articleId]/comment のレスポンススキーマ
 */
export const ArticleCommentSaveResponseSchema = ArticleCommentSchema;
export type ArticleCommentSaveResponse = v.InferOutput<
  typeof ArticleCommentSaveResponseSchema
>;
