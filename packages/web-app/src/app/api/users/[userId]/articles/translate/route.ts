import { NextResponse } from "next/server";
import * as v from "valibot";
import { translateArticle } from "@/features/articles/registration/api/translate.actions";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { toApiExceptionResponse } from "@/lib/api/response";
import {
  ArticleTranslateRequestSchema,
  ArticleTranslateResponseSchema,
} from "@/lib/api/schemas";
import { BadRequestError, InvalidResponseError } from "@/lib/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    await authorizeUserApiRequest(userId);

    const requestResult = v.safeParse(
      ArticleTranslateRequestSchema,
      await request.json().catch(() => null),
    );
    if (!requestResult.success) {
      throw new BadRequestError();
    }

    const response = await translateArticle(requestResult.output);
    const translationResult = v.safeParse(
      ArticleTranslateResponseSchema,
      response.translation,
    );
    if (!translationResult.success) {
      throw new InvalidResponseError();
    }

    return NextResponse.json(translationResult.output, {
      status: response.status,
    });
  } catch (error) {
    return toApiExceptionResponse(error);
  }
}
