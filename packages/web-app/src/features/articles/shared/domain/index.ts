import * as v from "valibot";

/**
 * ドメイン定義
 * - Valibotスキーマ + 型定義
 */

/**
 * 記事の入力元の種類のドメインモデル
 */
export const ArticleSourceSchema = v.variant("type", [
  v.object({
    type: v.literal("url"),
    url: v.pipe(v.string(), v.url()),
  }),
]);
export type ArticleSource = v.InferOutput<typeof ArticleSourceSchema>;

/**
 * 記事に対するコメントのドメインモデル
 * - 現時点では単一のコメントを想定してるが、複数にしたくなった場合を考慮してテーブルとしては分ける設計
 */
export const ArticleCommentSchema = v.object({
  commentId: v.pipe(v.string(), v.uuid()),
  articleId: v.pipe(v.string(), v.uuid()),
  userId: v.pipe(v.string(), v.uuid()),
  comment: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type ArticleComment = v.InferOutput<typeof ArticleCommentSchema>;

/**
 * 記事のタグのドメインモデル
 */
export const ArticleTagSchema = v.object({
  tagId: v.pipe(v.string(), v.uuid()),
  userId: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
  color: v.pipe(v.string(), v.hexColor()),
  description: v.optional(v.pipe(v.string(), v.maxLength(100)), ""),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type ArticleTag = v.InferOutput<typeof ArticleTagSchema>;

/**
 * 記事(Article)のドメインモデル
 */
export const ArticleSchema = v.object({
  articleId: v.pipe(v.string(), v.uuid()),
  userId: v.pipe(v.string(), v.uuid()),
  articleSource: ArticleSourceSchema,
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  publishedDate: v.pipe(v.string(), v.isoDate()),
  content: v.string(),
  isFavorite: v.boolean(),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
  comment: v.optional(ArticleCommentSchema),
  tags: v.optional(
    v.pipe(
      v.array(ArticleTagSchema),
      // タグの重複チェック
      v.check(
        (tags) => new Set(tags.map((tag) => tag.tagId)).size === tags.length,
      ),
    ),
    [],
  ),
});
export type Article = v.InferOutput<typeof ArticleSchema>;
