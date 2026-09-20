import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const deleteMany = vi.hoisted(() => vi.fn());
vi.mock("db", () => ({
  prisma: {
    article: { deleteMany },
  },
}));

import { deleteArticle } from "@/features/articles/detail/api/detail.actions";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ARTICLE_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  deleteMany.mockReset();
});

describe("deleteArticle", () => {
  it("記事 ID と所有者 ID を同じ条件にして削除する", async () => {
    deleteMany.mockResolvedValueOnce({ count: 1 });

    await expect(
      deleteArticle({ userId: USER_ID, articleId: ARTICLE_ID }),
    ).resolves.toBe(true);

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        article_id: ARTICLE_ID,
        user_id: USER_ID,
      },
    });
  });

  it("対象が存在しない場合は false を返す", async () => {
    deleteMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      deleteArticle({ userId: USER_ID, articleId: ARTICLE_ID }),
    ).resolves.toBe(false);
  });

  it("DB エラーを呼び出し元へ伝播する", async () => {
    const error = new Error("database unavailable");
    deleteMany.mockRejectedValueOnce(error);

    await expect(
      deleteArticle({ userId: USER_ID, articleId: ARTICLE_ID }),
    ).rejects.toBe(error);
  });
});
