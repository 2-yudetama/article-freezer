import "server-only";

import * as v from "valibot";
import { MdExtractorEnvironmentError } from "@/lib/errors";

const MdExtractorEnvSchema = v.object({
  MD_EXTRACTOR_BASE_URL: v.pipe(v.string(), v.url()),
  MD_EXTRACTOR_API_SECRET_KEY: v.pipe(v.string(), v.minLength(1)),
});

const getMdExtractorEnv = () => {
  const result = v.safeParse(MdExtractorEnvSchema, {
    MD_EXTRACTOR_BASE_URL: process.env.MD_EXTRACTOR_BASE_URL,
    MD_EXTRACTOR_API_SECRET_KEY: process.env.MD_EXTRACTOR_API_SECRET_KEY,
  });

  if (!result.success) {
    throw new MdExtractorEnvironmentError();
  }

  return result.output;
};

export function getMdExtractorSecretKey(): string {
  return getMdExtractorEnv().MD_EXTRACTOR_API_SECRET_KEY;
}

/**
 * md-extractorのエンドポイント
 */
export const MD_EXTRACTOR_ENDPOINTS = {
  EXTRACT: "api/extract",
  TRANSLATE: "api/translate",
} as const;
export type MD_EXTRACTOR_ENDPOINTS =
  (typeof MD_EXTRACTOR_ENDPOINTS)[keyof typeof MD_EXTRACTOR_ENDPOINTS];

export function getEndpointUrl(endpoint: MD_EXTRACTOR_ENDPOINTS): URL {
  const baseUrl = getMdExtractorEnv().MD_EXTRACTOR_BASE_URL;
  return new URL(endpoint, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
}
