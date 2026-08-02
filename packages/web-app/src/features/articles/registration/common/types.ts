import * as v from "valibot";
import { ArticleCommentSchema, ArticleSchema } from "@/domain/articles";

/**
 * 記事保存機能関連の型定義
 * - Valibotスキーマ + 型定義
 */

/**
 * 記事保存の URL ステップで利用する入力スキーマ。
 * 既存の Article ドメインから入力元だけを切り出して再利用する。
 */
export const RegistrationArticleSourceSchema = v.pick(ArticleSchema, [
  "articleSource",
]);
export type RegistrationArticleSource = v.InferOutput<
  typeof RegistrationArticleSourceSchema
>;

/**
 * 抽出結果ステップと保存前確認で利用する記事本文情報のスキーマ。
 * 保存途中で確定している記事メタデータだけを検証対象にする。
 */
export const RegistrationExtractedArticleSchema = v.pick(ArticleSchema, [
  "title",
  "publishedDate",
  "content",
]);
export type RegistrationExtractedArticle = v.InferOutput<
  typeof RegistrationExtractedArticleSchema
>;

/**
 * 記事保存のコメント入力で利用するスキーマ。
 * コメント本文の制約は既存の ArticleComment ドメイン定義を流用する。
 */
export const RegistrationCommentSchema = v.pick(ArticleCommentSchema, [
  "comment",
]);
export type RegistrationComment = v.InferOutput<
  typeof RegistrationCommentSchema
>;

/** 記事本文の翻訳処理結果 */
export type TranslationStatus = "translated" | "skipped";
