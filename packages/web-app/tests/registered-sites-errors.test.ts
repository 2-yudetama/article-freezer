import { describe, expect, it, vi } from "vitest";
import {
  FeedFetchError,
  FeedParseError,
} from "@/features/registered-sites/common/errors";

vi.mock("db", () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  },
}));
vi.mock("server-only", () => ({}));

import { toRegisteredSiteExceptionResponse } from "@/features/registered-sites/api/response";

describe("登録サイトの外部取得エラー応答", () => {
  it("SSRF はクライアント入力エラーとして拒否する", async () => {
    const response = toRegisteredSiteExceptionResponse(
      new FeedFetchError("private", "ssrf"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: expect.stringContaining("内部ネットワーク"),
    });
  });

  it("不正なフィード形式は再試行可能な入力エラーとして返す", async () => {
    const response = toRegisteredSiteExceptionResponse(new FeedParseError());

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      message: expect.stringContaining("リンクとして登録"),
    });
  });

  it("外部サイトの取得失敗は上流エラーとして返す", async () => {
    const response = toRegisteredSiteExceptionResponse(
      new FeedFetchError("forbidden", "http"),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      message: expect.stringContaining("フィードを取得できませんでした"),
    });
  });
});
