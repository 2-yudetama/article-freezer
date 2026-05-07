import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function useArticleComment({ userId, article }: Params) {
  const router = useRouter();
  const [comment, setComment] = useState(article.comment);
  const [isEditing, setIsEditing] = useState(false);
  const [input, setInput] = useState(article.comment?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEditing = () => {
    setInput(comment?.comment ?? "");
    setError(null);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setInput(comment?.comment ?? "");
    setError(null);
    setIsEditing(false);
    toast.info("コメント編集をキャンセルしました");
  };

  const handleSave = async () => {
    const normalizedComment = input.trim();

    if (!normalizedComment) {
      setError("コメントを入力してください");
      return;
    }

    if (normalizedComment.length > ARTICLE_COMMENT_MAX_LENGTH) {
      setError("コメントは1000文字以内で入力してください");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/users/${userId}/articles/${article.articleId}/comment`,
        {
          method: "PATCH",
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
        setError(errorMessage);
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
        setError(DEFAULT_ERROR_MESSAGE);
        toast.error("コメントを保存できませんでした", {
          description: DEFAULT_ERROR_MESSAGE,
        });
        return;
      }

      setComment(result.output);
      setInput(result.output.comment);
      setIsEditing(false);
      toast.success("コメントを保存しました");
      router.refresh();
    } catch {
      setError(DEFAULT_ERROR_MESSAGE);
      toast.error("コメントを保存できませんでした", {
        description: DEFAULT_ERROR_MESSAGE,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    comment,
    isEditing,
    input,
    error,
    isSaving,
    setInput,
    handleStartEditing,
    handleCancelEditing,
    handleSave,
  };
}
