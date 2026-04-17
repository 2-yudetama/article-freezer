import "server-only";

import * as v from "valibot";
import type { ArticleExtractRequest } from "@/lib/api/schemas";
import { InvalidResponseError } from "@/lib/errors";
import {
  type ExtractResponse,
  ExtractResponseSchema,
  getEndpointUrl,
  getMdExtractorSecretKey,
  MD_EXTRACTOR_ENDPOINTS,
  toMdExtractorError,
} from "@/lib/md-extractor";

/**
 * md-extractorを呼び出し、URLから記事を抽出してマークダウン化する
 */
export async function extractArticle(
  input: ArticleExtractRequest,
): Promise<{ article: ExtractResponse; status: number }> {
  const response = await fetch(getEndpointUrl(MD_EXTRACTOR_ENDPOINTS.EXTRACT), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMdExtractorSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw await toMdExtractorError(response);
  }

  const result = v.safeParse(
    ExtractResponseSchema,
    await response.json().catch(() => null),
  );
  if (!result.success) {
    throw new InvalidResponseError();
  }

  return {
    article: result.output,
    status: response.status,
  };
}
