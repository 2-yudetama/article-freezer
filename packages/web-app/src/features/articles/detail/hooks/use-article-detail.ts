import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as v from "valibot";
import { ARTICLE_COMMENT_MAX_LENGTH, type Article } from "@/domain/articles";
import {
  DEFAULT_ERROR_MESSAGE,
  getApiErrorMessage,
} from "@/lib/api/response.shared";
import { ArticleCommentSaveResponseSchema } from "@/lib/api/schemas";

type Params = {
  userId: string;
  article: Article;
};

export function useArticleDetail({ userId, article }: Params) {
  const router = useRouter();
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleComment, setArticleComment] = useState(article.comment);
  const [isCommentEditing, setIsCommentEditing] = useState(false);
  const [commentInput, setCommentInput] = useState(
    article.comment?.comment ?? "",
  );
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isCommentSaving, setIsCommentSaving] = useState(false);

  const handleDelete = () => {
    toast.info("記事削除は未実装です", {
      description: article.title,
    });
    router.refresh();
  };

  const handleScrollToComment = () => {
    commentSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleStartCommentEditing = () => {
    setCommentInput(articleComment?.comment ?? "");
    setCommentError(null);
    setIsCommentEditing(true);
  };

  const handleCancelCommentEditing = () => {
    setCommentInput(articleComment?.comment ?? "");
    setCommentError(null);
    setIsCommentEditing(false);
    toast.info("コメント編集をキャンセルしました");
  };

  const handleSaveComment = async () => {
    const normalizedComment = commentInput.trim();

    if (!normalizedComment) {
      setCommentError("コメントを入力してください");
      return;
    }

    if (normalizedComment.length > ARTICLE_COMMENT_MAX_LENGTH) {
      setCommentError("コメントは1000文字以内で入力してください");
      return;
    }

    setCommentError(null);
    setIsCommentSaving(true);

    try {
      const response = await fetch(
        `/api/users/${userId}/articles/${article.articleId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comment: normalizedComment,
          }),
        },
      );

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        setCommentError(errorMessage);
        toast.error("コメントを保存できませんでした", {
          description: errorMessage,
        });
        return;
      }

      const result = v.safeParse(
        ArticleCommentSaveResponseSchema,
        await response.json().catch(() => null),
      );
      if (!result.success) {
        setCommentError(DEFAULT_ERROR_MESSAGE);
        toast.error("コメントを保存できませんでした", {
          description: DEFAULT_ERROR_MESSAGE,
        });
        return;
      }

      setArticleComment(result.output);
      setCommentInput(result.output.comment);
      setIsCommentEditing(false);
      toast.success("コメントを保存しました");
      router.refresh();
    } catch {
      setCommentError(DEFAULT_ERROR_MESSAGE);
      toast.error("コメントを保存できませんでした", {
        description: DEFAULT_ERROR_MESSAGE,
      });
    } finally {
      setIsCommentSaving(false);
    }
  };

  return {
    userId,
    article: {
      ...article,
      comment: articleComment,
    },
    deleteDialogOpen,
    commentSectionRef,
    isCommentEditing,
    commentInput,
    commentError,
    isCommentSaving,
    setDeleteDialogOpen,
    setCommentInput,
    handleDelete,
    handleScrollToComment,
    handleStartCommentEditing,
    handleCancelCommentEditing,
    handleSaveComment,
  };
}
