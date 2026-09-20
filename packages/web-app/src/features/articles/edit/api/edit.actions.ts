import "server-only";

import { prisma } from "db";
import type { ArticleUpdateRequest } from "@/lib/api/schemas";
import { BadRequestError, NotFoundError } from "@/lib/errors";

/**
 * 所有者の記事のタイトルと本文だけを更新する
 *
 * article_id と user_id を同じ条件に含めることで、所有確認と更新を
 * 単一のデータベース操作として扱う。Prisma の @updatedAt により
 * updated_at は自動更新されるが、その他の関連データは変更しない。
 */
export async function updateArticle({
  userId,
  articleId,
  input,
}: {
  userId: string;
  articleId: string;
  input: ArticleUpdateRequest;
}): Promise<boolean> {
  const title = input.title.trim();
  if (!title || title.length > 255 || input.content.trim().length === 0) {
    throw new BadRequestError();
  }

  const result = await prisma.article.updateMany({
    where: {
      article_id: articleId,
      user_id: userId,
    },
    data: {
      title,
      content: input.content,
    },
  });

  if (result.count !== 1) {
    throw new NotFoundError();
  }

  return true;
}
