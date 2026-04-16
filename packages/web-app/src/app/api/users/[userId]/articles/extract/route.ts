import { NextResponse } from "next/server";
import * as v from "valibot";
import { extractArticle } from "@/features/articles/registration/api/extract.actions";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { toApiExceptionResponse } from "@/lib/api/response";
import {
  ArticleExtractRequestSchema,
  ArticleExtractResponseSchema,
} from "@/lib/api/schemas";
import { BadRequestError, InvalidResponseError } from "@/lib/errors";

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

    const response = await extractArticle(requestResult.output);

    const articleResult = v.safeParse(
      ArticleExtractResponseSchema,
      response.article,
    );
    if (!articleResult.success) {
      throw new InvalidResponseError();
    }

    return NextResponse.json(articleResult.output, { status: response.status });
  } catch (error) {
    return toApiExceptionResponse(error);
  }
}
