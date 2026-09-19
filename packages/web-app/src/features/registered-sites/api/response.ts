import { Prisma } from "db";
import { NextResponse } from "next/server";
import { toApiExceptionResponse } from "@/lib/api/response";
import {
  FeedCandidatesError,
  FeedCursorStaleError,
  FeedFetchError,
  FeedInputError,
  FeedParseError,
  FeedRateLimitError,
} from "../common/errors";

export function toRegisteredSiteExceptionResponse(error: unknown) {
  if (error instanceof FeedCandidatesError) {
    return NextResponse.json(
      {
        name: error.name,
        message: error.message,
        candidates: error.candidates,
      },
      { status: 409 },
    );
  }

  if (error instanceof FeedRateLimitError) {
    const retryAfter = Math.max(
      1,
      Math.ceil((error.retryAt.getTime() - Date.now()) / 1000),
    );
    return NextResponse.json(
      {
        name: error.name,
        message: "次回取得可能時刻までお待ちください",
        retryAt: error.retryAt.toISOString(),
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  if (error instanceof FeedCursorStaleError) {
    return NextResponse.json(
      {
        name: error.name,
        message: "一覧が更新されました。先頭から読み直してください",
      },
      { status: 409 },
    );
  }

  if (error instanceof FeedInputError) {
    return NextResponse.json(
      { name: error.name, message: error.message },
      { status: 400 },
    );
  }

  if (error instanceof FeedFetchError || error instanceof FeedParseError) {
    return NextResponse.json(
      {
        name: error.name,
        message: "フィードを取得または解析できませんでした。再試行してください",
      },
      { status: 502 },
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { name: "ConflictError", message: "同じ登録先はすでに登録されています" },
      { status: 409 },
    );
  }

  return toApiExceptionResponse(error);
}
