import { NextResponse } from "next/server";
import * as v from "valibot";
import { deleteArticle } from "@/features/articles/detail/api/detail.actions";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { toApiExceptionResponse } from "@/lib/api/response";
import { ArticleUpdateRequestSchema } from "@/lib/api/schemas";
import { BadRequestError, NotFoundError } from "@/lib/errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string; articleId: string }> },
) {
  try {
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
      ArticleUpdateRequestSchema,
      await request.json().catch(() => null),
    );
    if (!requestResult.success) {
      throw new BadRequestError();
    }

    const { updateArticle } = await import(
      "@/features/articles/edit/api/edit.actions"
    );

    await updateArticle({
      userId,
      articleId: articleIdResult.output,
      input: requestResult.output,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toApiExceptionResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string; articleId: string }> },
) {
  try {
    const { userId, articleId } = await params;
    await authorizeUserApiRequest(userId);

    const articleIdResult = v.safeParse(
      v.pipe(v.string(), v.uuid()),
      articleId,
    );
    if (!articleIdResult.success) {
      throw new NotFoundError();
    }

    const deleted = await deleteArticle({
      userId,
      articleId: articleIdResult.output,
    });
    if (!deleted) {
      throw new NotFoundError();
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toApiExceptionResponse(error);
  }
}
