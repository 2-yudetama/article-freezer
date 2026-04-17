import "server-only";

import { Prisma, prisma } from "db";
import type { Article } from "@/domain/articles";
import type { ArticleRegistrationRequest } from "@/lib/api/schemas";
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
  const { article, comment, selectedTagIds } = input;
  try {
    const selectedTags =
      selectedTagIds.length > 0
        ? await prisma.articleTag.findMany({
            where: {
              tag_id: {
                in: selectedTagIds,
              },
              user_id: userId,
            },
          })
        : [];

    if (selectedTags.length !== selectedTagIds.length) {
      throw new NotFoundError();
    }

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
        ...(selectedTags.length > 0
          ? {
              article_tags: {
                createMany: {
                  data: selectedTags.map((tag) => ({
                    tag_id: tag.tag_id,
                  })),
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
      tags: selectedTags.map((tag) => ({
        tagId: tag.tag_id,
        userId: tag.user_id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        createdAt: tag.created_at.toISOString(),
        updatedAt: tag.updated_at.toISOString(),
      })),
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
