import "server-only";

import * as v from "valibot";
import type { ArticleTranslateRequest } from "@/lib/api/schemas";
import { InvalidResponseError } from "@/lib/errors";
import {
  getEndpointUrl,
  getMdExtractorSecretKey,
  MD_EXTRACTOR_ENDPOINTS,
  type TranslateResponse,
  TranslateResponseSchema,
  toMdExtractorError,
} from "@/lib/md-extractor";

/** md-extractorを呼び出し、記事Markdownを日本語に翻訳する */
export async function translateArticle(
  input: ArticleTranslateRequest,
): Promise<{ translation: TranslateResponse; status: number }> {
  const response = await fetch(
    getEndpointUrl(MD_EXTRACTOR_ENDPOINTS.TRANSLATE),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getMdExtractorSecretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    throw await toMdExtractorError(response);
  }

  const result = v.safeParse(
    TranslateResponseSchema,
    await response.json().catch(() => null),
  );
  if (!result.success) {
    throw new InvalidResponseError();
  }

  return {
    translation: result.output,
    status: response.status,
  };
}
