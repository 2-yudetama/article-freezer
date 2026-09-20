import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const updateMany = vi.hoisted(() => vi.fn());
vi.mock("db", () => ({
  prisma: {
    article: { updateMany },
  },
}));

import { updateArticle } from "@/features/articles/edit/api/edit.actions";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ARTICLE_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  updateMany.mockReset();
});

describe("updateArticle", () => {
  it("所有者の記事を title/content だけ更新する", async () => {
    updateMany.mockResolvedValueOnce({ count: 1 });

    await expect(
      updateArticle({
        userId: USER_ID,
        articleId: ARTICLE_ID,
        input: {
          title: "  更新後のタイトル  ",
          content: "# 更新後の本文",
        },
      }),
    ).resolves.toBe(true);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        article_id: ARTICLE_ID,
        user_id: USER_ID,
      },
      data: {
        title: "更新後のタイトル",
        content: "# 更新後の本文",
      },
    });
  });

  it("所有者でない記事は更新せず 404 用エラーを返す", async () => {
    updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      updateArticle({
        userId: USER_ID,
        articleId: ARTICLE_ID,
        input: {
          title: "更新後のタイトル",
          content: "更新後の本文",
        },
      }),
    ).rejects.toMatchObject({ name: "NotFoundError" });
  });

  it("空白だけのタイトルまたは本文は更新しない", async () => {
    await expect(
      updateArticle({
        userId: USER_ID,
        articleId: ARTICLE_ID,
        input: {
          title: "   ",
          content: "本文",
        },
      }),
    ).rejects.toMatchObject({ name: "BadRequestError" });

    await expect(
      updateArticle({
        userId: USER_ID,
        articleId: ARTICLE_ID,
        input: {
          title: "タイトル",
          content: " \n ",
        },
      }),
    ).rejects.toMatchObject({ name: "BadRequestError" });

    expect(updateMany).not.toHaveBeenCalled();
  });
});
