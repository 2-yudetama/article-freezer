import * as v from "valibot";
import { ArticleCommentSchema, ArticleSchema } from "@/domain/articles";

/**
 * 記事登録の URL ステップで利用する入力スキーマ。
 * 既存の Article ドメインから入力元だけを切り出して再利用する。
 */
export const RegistrationArticleSourceSchema = v.pick(ArticleSchema, [
  "articleSource",
]);

/**
 * 抽出結果ステップと保存前確認で利用する記事本文情報のスキーマ。
 * 登録途中で確定している記事メタデータだけを検証対象にする。
 */
export const RegistrationExtractedArticleSchema = v.pick(ArticleSchema, [
  "title",
  "publishedDate",
  "content",
]);

/**
 * 記事登録のコメント入力で利用するスキーマ。
 * コメント本文の制約は既存の ArticleComment ドメイン定義を流用する。
 */
export const RegistrationCommentSchema = v.pick(ArticleCommentSchema, [
  "comment",
]);

/**
 * 保存直前の最終確認で利用する登録内容全体のスキーマ。
 * 記事本体、任意コメント、選択タグ ID の整合性をまとめて検証する。
 */
export const RegistrationSaveSchema = v.object({
  article: v.intersect([
    RegistrationArticleSourceSchema,
    RegistrationExtractedArticleSchema,
  ]),
  comment: v.optional(RegistrationCommentSchema),
  selectedTagIds: v.pipe(
    v.array(v.string()),
    v.check(
      (tagIds) => new Set(tagIds).size === tagIds.length,
      "タグが重複しています",
    ),
  ),
});
