import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getArticle = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("@/features/articles/detail/api/detail.actions", () => ({
  getArticle,
}));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/features/articles/edit/page-client", () => ({
  default: "article-edit-page-client",
}));

import type { Article } from "@/domain/articles";
import ArticleEditPage from "@/features/articles/edit/page";
import { NotFoundError } from "@/lib/errors";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ARTICLE_ID = "22222222-2222-4222-8222-222222222222";
const article: Article = {
  articleId: ARTICLE_ID,
  userId: USER_ID,
  articleSource: {
    type: "url",
    url: "https://example.com/article",
  },
  title: "実データの記事",
  publishedDate: null,
  content: "本文",
  isFavorite: false,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
  tags: [],
};

beforeEach(() => {
  getArticle.mockReset().mockResolvedValue(article);
  notFound.mockClear();
});

describe("記事編集ページ", () => {
  it("URLのユーザと記事を使って DB の記事を取得する", async () => {
    const result = await ArticleEditPage({
      params: Promise.resolve({
        userId: USER_ID,
        article_id: ARTICLE_ID,
      }),
    });

    expect(getArticle).toHaveBeenCalledWith({
      userId: USER_ID,
      articleId: ARTICLE_ID,
    });
    expect(result).toMatchObject({
      type: "article-edit-page-client",
      props: {
        userId: USER_ID,
        article,
      },
    });
  });

  it("存在しない記事や所有しない記事は 404 にする", async () => {
    getArticle.mockRejectedValueOnce(new NotFoundError());

    await expect(
      ArticleEditPage({
        params: Promise.resolve({
          userId: USER_ID,
          article_id: ARTICLE_ID,
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("不正な記事 ID は DB 呼び出し前に 404 にする", async () => {
    await expect(
      ArticleEditPage({
        params: Promise.resolve({
          userId: USER_ID,
          article_id: "not-an-article-id",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
    expect(getArticle).not.toHaveBeenCalled();
  });
});
