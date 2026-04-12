import { NextResponse } from "next/server";
import * as v from "valibot";
import {
  ArticleExtractRequestSchema,
  ArticleExtractResponseSchema,
} from "@/features/articles/shared/api";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { toApiExceptionResponse } from "@/lib/api/response";
import { BadRequestError, InvalidResponseError } from "@/lib/errors";
import {
  ExtractResponseSchema,
  getEndpointUrl,
  getMdExtractorSecretKey,
  MD_EXTRACTOR_ENDPOINTS,
  toMdExtractorError,
} from "@/lib/md-extractor";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // ユーザの検証
    const { userId } = await params;
    await authorizeUserApiRequest(userId);

    const requestResult = v.safeParse(
      ArticleExtractRequestSchema,
      await request.json().catch(() => null),
    );
    if (!requestResult.success) {
      throw new BadRequestError();
    }

    const response = await fetch(
      getEndpointUrl(MD_EXTRACTOR_ENDPOINTS.EXTRACT),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getMdExtractorSecretKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestResult.output),
      },
    );
    if (!response.ok) {
      throw await toMdExtractorError(response);
    }

    const mdExtractorResponseResult = v.safeParse(
      ExtractResponseSchema,
      await response.json().catch(() => null),
    );
    if (!mdExtractorResponseResult.success) {
      throw new InvalidResponseError();
    }

    const articleResult = v.safeParse(
      ArticleExtractResponseSchema,
      mdExtractorResponseResult.output,
    );
    if (!articleResult.success) {
      throw new InvalidResponseError();
    }

    return NextResponse.json(articleResult.output, { status: response.status });
  } catch (error) {
    return toApiExceptionResponse(error);
  }
}
