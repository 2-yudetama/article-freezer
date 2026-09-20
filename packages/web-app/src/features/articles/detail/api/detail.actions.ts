import "server-only";

import { type Prisma, prisma } from "db";
import type { Article } from "@/domain/articles";
import { DataIntegrityError, NotFoundError } from "@/lib/errors";

type ArticleDetailRecord = Prisma.ArticleGetPayload<{
  include: {
    articleSource: true;
    comment: true;
    article_tags: {
      include: {
        tag: true;
      };
    };
  };
}>;

function toArticle(article: ArticleDetailRecord): Article {
  if (!article.articleSource) {
    throw new DataIntegrityError("Article source is required.");
  }
  if (article.articleSource.type !== "url") {
    throw new DataIntegrityError("Unsupported article source type.");
  }

  return {
    articleId: article.article_id,
    userId: article.user_id,
    articleSource: {
      type: article.articleSource.type,
      url: article.articleSource.url,
    },
    title: article.title,
    publishedDate: article.published_date,
    content: article.content,
    isFavorite: article.is_favorite,
    createdAt: article.created_at.toISOString(),
    updatedAt: article.updated_at.toISOString(),
    comment: article.comment
      ? {
          commentId: article.comment.comment_id,
          articleId: article.comment.article_id,
          userId: article.comment.user_id,
          comment: article.comment.comment,
          createdAt: article.comment.created_at.toISOString(),
          updatedAt: article.comment.updated_at.toISOString(),
        }
      : undefined,
    tags: article.article_tags.map(({ tag }) => ({
      tagId: tag.tag_id,
      userId: tag.user_id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      createdAt: tag.created_at.toISOString(),
      updatedAt: tag.updated_at.toISOString(),
    })),
  };
}

/**
 * DBから特定の記事を取得する
 */
export async function getArticle({
  userId,
  articleId,
}: {
  userId: string;
  articleId: string;
}): Promise<Article> {
  const article = await prisma.article.findFirst({
    where: {
      user_id: userId,
      article_id: articleId,
    },
    include: {
      articleSource: true,
      comment: true,
      article_tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!article) {
    throw new NotFoundError("Article not found.");
  }

  return toArticle(article);
}

/**
 * ユーザが所有する記事を削除する
 *
 * 記事 ID とユーザ ID を同じ deleteMany の条件に含めることで、所有確認と
 * 削除を単一のデータベース操作として扱う。関連する入力元・コメント・
 * タグとの中間レコードは、スキーマの Cascade 設定により削除される。
 */
export async function deleteArticle({
  userId,
  articleId,
}: {
  userId: string;
  articleId: string;
}) {
  const result = await prisma.article.deleteMany({
    where: {
      article_id: articleId,
      user_id: userId,
    },
  });

  return result.count === 1;
}
