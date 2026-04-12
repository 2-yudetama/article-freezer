import "server-only";

import { getLogger } from "@logtape/logtape";
import { NextResponse } from "next/server";
import {
  InvalidRequestError,
  InvalidResponseError,
  MdExtractorEnvironmentError,
  MdExtractorRequestError,
} from "@/lib/errors";
import { mapMdExtractorErrorResponse } from "@/lib/md-extractor";
import {
  type ApiErrorResponse,
  DEFAULT_ERROR_MESSAGE,
} from "./response.shared";

const logger = getLogger(["web-app", "api"]);

function toApiErrorResponse(error: unknown, message: string): ApiErrorResponse {
  return {
    name: error instanceof Error ? error.name : "Error",
    message,
  };
}

function logApiError(error: unknown) {
  const errorName = error instanceof Error ? error.name : "Error";
  const errorMessage = error instanceof Error ? error.message : String(error);
  const properties = {
    errorName,
    errorMessage,
    ...(error instanceof MdExtractorRequestError
      ? {
          responseName: error.responseName,
          responseStatus: error.responseStatus,
        }
      : {}),
  };

  logger.error("API request failed", properties);
}

/**
 * カスタムエラーをAPIレスポンスに変換する
 * - NOTE: ここでのmessageはクライアント側にも表示される想定のため日本語にしている
 */
export function toApiExceptionResponse(
  error: unknown,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
): NextResponse<ApiErrorResponse> {
  logApiError(error);

  if (error instanceof InvalidRequestError) {
    return NextResponse.json(
      toApiErrorResponse(error, "リクエスト内容に不備がないか確認してください"),
      { status: 400 },
    );
  }

  if (error instanceof InvalidResponseError) {
    return NextResponse.json(
      toApiErrorResponse(error, "処理結果を正しく取得できませんでした"),
      {
        status: 502,
      },
    );
  }

  if (error instanceof MdExtractorEnvironmentError) {
    return NextResponse.json(toApiErrorResponse(error, fallbackMessage), {
      status: 500,
    });
  }

  if (error instanceof MdExtractorRequestError) {
    // md-extractorのエラーレスポンスからApp Routerのレスポンスに整形
    const { status, message } = mapMdExtractorErrorResponse(
      error.responseStatus,
      error.responseName,
    );

    return NextResponse.json(toApiErrorResponse(error, message), {
      status,
    });
  }

  return NextResponse.json(toApiErrorResponse(error, fallbackMessage), {
    status: 500,
  });
}
