import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("db", () => ({
  prisma: {
    article: {},
  },
}));

const auth = vi.hoisted(() => vi.fn());
const updateArticle = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/features/articles/edit/api/edit.actions", () => ({
  updateArticle,
}));

import { PATCH } from "@/app/api/users/[userId]/articles/[articleId]/route";
import { NotFoundError } from "@/lib/errors";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ARTICLE_ID = "22222222-2222-4222-8222-222222222222";

function params(
  userId = USER_ID,
  articleId = ARTICLE_ID,
): { params: Promise<{ userId: string; articleId: string }> } {
  return { params: Promise.resolve({ userId, articleId }) };
}

function request(body: unknown) {
  return new Request("http://localhost", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  auth.mockReset().mockResolvedValue({
    user: {
      id: USER_ID,
      role: 1,
    },
  });
  updateArticle.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("記事更新 API", () => {
  it("所有者の記事を更新して 204 を返す", async () => {
    const response = await PATCH(
      request({ title: "更新後のタイトル", content: "# 更新後の本文" }),
      params(),
    );

    expect(response.status).toBe(204);
    expect(updateArticle).toHaveBeenCalledWith({
      userId: USER_ID,
      articleId: ARTICLE_ID,
      input: {
        title: "更新後のタイトル",
        content: "# 更新後の本文",
      },
    });
  });

  it("不正な入力を 400 として拒否する", async () => {
    const response = await PATCH(
      request({ title: "   ", content: "本文" }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it("本文が空の場合を 400 として拒否する", async () => {
    const response = await PATCH(
      request({ title: "タイトル", content: "\n  " }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it("不正な記事 ID を 404 として拒否する", async () => {
    const response = await PATCH(
      request({ title: "タイトル", content: "本文" }),
      params(USER_ID, "not-an-article-id"),
    );

    expect(response.status).toBe(404);
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it("未認証のリクエストを 401 として拒否する", async () => {
    auth.mockResolvedValueOnce(null);

    const response = await PATCH(
      request({ title: "タイトル", content: "本文" }),
      params(),
    );

    expect(response.status).toBe(401);
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it("他ユーザの URL を 404 として拒否する", async () => {
    auth.mockResolvedValueOnce({
      user: {
        id: "33333333-3333-4333-8333-333333333333",
        role: 1,
      },
    });

    const response = await PATCH(
      request({ title: "タイトル", content: "本文" }),
      params(USER_ID),
    );

    expect(response.status).toBe(404);
    expect(updateArticle).not.toHaveBeenCalled();
  });

  it("所有しない記事は 404 として返す", async () => {
    updateArticle.mockRejectedValueOnce(new NotFoundError());
    const response = await PATCH(
      request({ title: "タイトル", content: "本文" }),
      params(),
    );

    expect(response.status).toBe(404);
  });

  it("ロール権限がない場合を 403 として拒否する", async () => {
    auth.mockResolvedValueOnce({
      user: {
        id: USER_ID,
        role: 0,
      },
    });

    const response = await PATCH(
      request({ title: "タイトル", content: "本文" }),
      params(),
    );

    expect(response.status).toBe(403);
    expect(updateArticle).not.toHaveBeenCalled();
  });
});
