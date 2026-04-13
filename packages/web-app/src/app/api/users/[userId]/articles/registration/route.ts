import { NextResponse } from "next/server";
import * as v from "valibot";
import { registerArticle } from "@/features/articles/registration/api/registration.actions";
import {
  ArticleRegistrationRequestSchema,
  ArticleRegistrationResponseSchema,
} from "@/features/articles/shared/api";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { toApiExceptionResponse } from "@/lib/api/response";
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
      ArticleRegistrationRequestSchema,
      await request.json().catch(() => null),
    );
    if (!requestResult.success) {
      throw new BadRequestError();
    }

    const response = await registerArticle({
      userId,
      input: requestResult.output,
    });

    const responseResult = v.safeParse(
      ArticleRegistrationResponseSchema,
      response,
    );
    if (!responseResult.success) {
      throw new InvalidResponseError();
    }

    return NextResponse.json(responseResult.output, { status: 201 });
  } catch (error) {
    return toApiExceptionResponse(error);
  }
}
