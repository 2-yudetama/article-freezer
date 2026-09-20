import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, UnauthorizedError } from "@/lib/errors";

vi.mock("server-only", () => ({}));

const authorizeUserApiRequest = vi.hoisted(() => vi.fn());
const deleteArticle = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/auth-user", () => ({ authorizeUserApiRequest }));
vi.mock("@/features/articles/detail/api/detail.actions", () => ({
  deleteArticle,
}));

import { DELETE } from "@/app/api/users/[userId]/articles/[articleId]/route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ARTICLE_ID = "22222222-2222-4222-8222-222222222222";

function params(
  userId = USER_ID,
  articleId = ARTICLE_ID,
): { params: Promise<{ userId: string; articleId: string }> } {
  return { params: Promise.resolve({ userId, articleId }) };
}

beforeEach(() => {
  authorizeUserApiRequest.mockReset().mockResolvedValue(undefined);
  deleteArticle.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("記事削除 API", () => {
  it("所有者の記事を削除して 204 を返す", async () => {
    const response = await DELETE(new Request("http://localhost"), params());

    expect(response.status).toBe(204);
    expect(deleteArticle).toHaveBeenCalledWith({
      userId: USER_ID,
      articleId: ARTICLE_ID,
    });
  });

  it("不正な記事 ID を 400 として拒否する", async () => {
    const response = await DELETE(
      new Request("http://localhost"),
      params(USER_ID, "not-an-article-id"),
    );

    expect(response.status).toBe(400);
    expect(deleteArticle).not.toHaveBeenCalled();
  });

  it("未認証のリクエストを 401 として拒否する", async () => {
    authorizeUserApiRequest.mockRejectedValueOnce(new UnauthorizedError());

    const response = await DELETE(new Request("http://localhost"), params());

    expect(response.status).toBe(401);
    expect(deleteArticle).not.toHaveBeenCalled();
  });

  it("他ユーザの URL を 404 として拒否する", async () => {
    authorizeUserApiRequest.mockRejectedValueOnce(new NotFoundError());

    const response = await DELETE(
      new Request("http://localhost"),
      params("33333333-3333-4333-8333-333333333333"),
    );

    expect(response.status).toBe(404);
    expect(deleteArticle).not.toHaveBeenCalled();
  });

  it("存在しない記事を 404 として返す", async () => {
    deleteArticle.mockResolvedValueOnce(false);

    const response = await DELETE(new Request("http://localhost"), params());

    expect(response.status).toBe(404);
  });

  it("DB エラーを 500 として返す", async () => {
    deleteArticle.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await DELETE(new Request("http://localhost"), params());

    expect(response.status).toBe(500);
  });
});
