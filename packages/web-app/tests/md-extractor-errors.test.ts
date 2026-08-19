import { describe, expect, it } from "vitest";
import { DEFAULT_ERROR_MESSAGE } from "@/lib/api/response.shared";
import {
  mapMdExtractorErrorResponse,
  toMdExtractorError,
} from "@/lib/md-extractor/errors";

describe("mapMdExtractorErrorResponse", () => {
  it("md-extractorの認証エラーを一般的なサーバエラーに変換する", () => {
    expect(mapMdExtractorErrorResponse(401, "UnauthorizedError")).toEqual({
      status: 500,
      message: DEFAULT_ERROR_MESSAGE,
    });
  });

  it("既存のエラー変換を維持する", () => {
    expect(
      mapMdExtractorErrorResponse(504, "ArticleContentTimeoutError"),
    ).toEqual({
      status: 504,
      message: "記事の取得がタイムアウトしました",
    });
  });
});

describe("toMdExtractorError", () => {
  it("上流の認証エラー情報をログ用エラーに保持しつつ利用者向け変換には露出しない", async () => {
    const error = await toMdExtractorError(
      Response.json(
        {
          name: "UnauthorizedError",
          message: "Bearer token does not match the configured secret",
        },
        { status: 401 },
      ),
    );

    expect(error).toMatchObject({
      message: "Bearer token does not match the configured secret",
      responseName: "UnauthorizedError",
      responseStatus: 401,
    });
    expect(
      mapMdExtractorErrorResponse(error.responseStatus, error.responseName),
    ).toEqual({
      status: 500,
      message: DEFAULT_ERROR_MESSAGE,
    });
  });
});
