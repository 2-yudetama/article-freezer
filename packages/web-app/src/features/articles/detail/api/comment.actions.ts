import "server-only";

import { type Prisma, prisma } from "db";
import {
  ARTICLE_COMMENT_MAX_LENGTH,
  type ArticleComment,
} from "@/domain/articles";
import { BadRequestError, NotFoundError } from "@/lib/errors";

type ArticleCommentRecord = Prisma.ArticleCommentGetPayload<object>;

function toArticleComment(comment: ArticleCommentRecord): ArticleComment {
  return {
    commentId: comment.comment_id,
    articleId: comment.article_id,
    userId: comment.user_id,
    comment: comment.comment,
    createdAt: comment.created_at.toISOString(),
    updatedAt: comment.updated_at.toISOString(),
  };
}

export async function saveArticleComment({
  userId,
  articleId,
  comment,
}: {
  userId: string;
  articleId: string;
  comment: string;
}): Promise<ArticleComment> {
  const normalizedComment = comment.trim();

  if (!normalizedComment) {
    throw new BadRequestError();
  }

  if (normalizedComment.length > ARTICLE_COMMENT_MAX_LENGTH) {
    throw new BadRequestError();
  }

  const article = await prisma.article.findFirst({
    where: {
      article_id: articleId,
      user_id: userId,
    },
    select: {
      article_id: true,
      user_id: true,
      comment: {
        select: {
          comment_id: true,
        },
      },
    },
  });

  if (!article) {
    throw new NotFoundError();
  }

  const savedComment = await prisma.articleComment.upsert({
    where: {
      article_id: article.article_id,
    },
    update: {
      comment: normalizedComment,
    },
    create: {
      article_id: article.article_id,
      user_id: article.user_id,
      comment: normalizedComment,
    },
  });

  return toArticleComment(savedComment);
}
