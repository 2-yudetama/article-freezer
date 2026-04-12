import * as v from "valibot";
import { ArticleSchema } from "@/domain/articles";

/**
 * md-extractorのスキーマ定義
 * - Valibotスキーマ + 型定義
 */

/**
 * POST /api/extract のリクエストスキーマ
 */
export const ExtractRequestSchema = v.pick(ArticleSchema, ["articleSource"]);
export type ExtractRequest = v.InferOutput<typeof ExtractRequestSchema>;

/**
 * POST /api/extract のレスポンススキーマ
 */
export const ExtractResponseSchema = v.pick(ArticleSchema, [
  "articleSource",
  "title",
  "publishedDate",
  "content",
]);
export type ExtractResponse = v.InferOutput<typeof ExtractResponseSchema>;
