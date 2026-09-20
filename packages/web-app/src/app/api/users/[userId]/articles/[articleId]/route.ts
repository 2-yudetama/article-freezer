import { NextResponse } from "next/server";
import * as v from "valibot";
import { deleteArticle } from "@/features/articles/detail/api/detail.actions";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { toApiExceptionResponse } from "@/lib/api/response";
import { NotFoundError } from "@/lib/errors";

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
