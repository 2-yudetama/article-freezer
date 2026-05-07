import { NextResponse } from "next/server";
import * as v from "valibot";
import { saveArticleComment } from "@/features/articles/detail/api/comment.actions";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { toApiExceptionResponse } from "@/lib/api/response";
import {
  ArticleCommentSaveRequestSchema,
  ArticleCommentSaveResponseSchema,
} from "@/lib/api/schemas";
import {
  BadRequestError,
  InvalidResponseError,
  NotFoundError,
} from "@/lib/errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string; articleId: string }> },
) {
  try {
    // ユーザの検証
    const { userId, articleId } = await params;
    await authorizeUserApiRequest(userId);
    const articleIdResult = v.safeParse(
      v.pipe(v.string(), v.uuid()),
      articleId,
    );
    if (!articleIdResult.success) {
      throw new NotFoundError();
    }

    const requestResult = v.safeParse(
      ArticleCommentSaveRequestSchema,
      await request.json().catch(() => null),
    );
    if (!requestResult.success) {
      throw new BadRequestError();
    }

    const response = await saveArticleComment({
      userId,
      articleId: articleIdResult.output,
      comment: requestResult.output.comment,
    });

    const responseResult = v.safeParse(
      ArticleCommentSaveResponseSchema,
      response,
    );
    if (!responseResult.success) {
      throw new InvalidResponseError();
    }

    return NextResponse.json(responseResult.output);
  } catch (error) {
    return toApiExceptionResponse(error);
  }
}
