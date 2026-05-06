"use server";

import { type Prisma, prisma } from "db";
import type { ArticleComment } from "@/domain/articles";

const COMMENT_MAX_LENGTH = 1000;

type SaveArticleCommentResult =
  | {
      success: true;
      comment: ArticleComment;
    }
  | {
      success: false;
      error: string;
    };

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
}): Promise<SaveArticleCommentResult> {
  const normalizedComment = comment.trim();

  if (!normalizedComment) {
    return {
      success: false,
      error: "コメントを入力してください",
    };
  }

  if (normalizedComment.length > COMMENT_MAX_LENGTH) {
    return {
      success: false,
      error: "コメントは1000文字以内で入力してください",
    };
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
    return {
      success: false,
      error: "記事が見つかりません",
    };
  }

  const savedComment = article.comment
    ? await prisma.articleComment.update({
        where: {
          comment_id: article.comment.comment_id,
        },
        data: {
          comment: normalizedComment,
        },
      })
    : await prisma.articleComment.create({
        data: {
          article_id: article.article_id,
          user_id: article.user_id,
          comment: normalizedComment,
        },
      });

  return {
    success: true,
    comment: toArticleComment(savedComment),
  };
}
