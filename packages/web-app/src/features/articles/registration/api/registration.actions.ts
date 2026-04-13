import "server-only";

import { Prisma, prisma } from "db";
import type { Article } from "@/domain/articles";
import type { ArticleRegistrationRequest } from "@/features/articles/shared/api";
import { NotFoundError } from "@/lib/errors";

/**
 * 記事をDBに保存する
 */
export async function registerArticle({
  userId,
  input,
}: {
  userId: string;
  input: ArticleRegistrationRequest;
}): Promise<Article> {
  const { article, comment } = input;
  try {
    const createdArticle = await prisma.article.create({
      data: {
        user_id: userId,
        title: article.title,
        published_date: article.publishedDate,
        content: article.content,
        articleSource: {
          create: {
            type: article.articleSource.type,
            url: article.articleSource.url,
          },
        },
        ...(comment
          ? {
              comment: {
                create: {
                  user_id: userId,
                  comment: comment.comment,
                },
              },
            }
          : {}),
      },
      include: {
        articleSource: true,
        comment: true,
      },
    });

    return {
      articleId: createdArticle.article_id,
      userId: createdArticle.user_id,
      articleSource: {
        type: "url",
        url: createdArticle.articleSource?.url ?? article.articleSource.url,
      },
      title: createdArticle.title,
      publishedDate: createdArticle.published_date,
      content: createdArticle.content,
      isFavorite: createdArticle.is_favorite,
      createdAt: createdArticle.created_at.toISOString(),
      updatedAt: createdArticle.updated_at.toISOString(),
      comment: createdArticle.comment
        ? {
            commentId: createdArticle.comment.comment_id,
            articleId: createdArticle.comment.article_id,
            userId: createdArticle.comment.user_id,
            comment: createdArticle.comment.comment,
            createdAt: createdArticle.comment.created_at.toISOString(),
            updatedAt: createdArticle.comment.updated_at.toISOString(),
          }
        : undefined,
      tags: [],
    };
  } catch (error) {
    // P2003は外部キー制約違反
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new NotFoundError("Failed to find related resource.", {
        cause: error,
      });
    }

    throw error;
  }
}
