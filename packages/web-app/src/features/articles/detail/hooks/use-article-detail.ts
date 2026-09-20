import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Article } from "@/domain/articles";
import {
  DEFAULT_ERROR_MESSAGE,
  getApiErrorMessage,
} from "@/lib/api/response.shared";
import { useArticleComment } from "./use-article-comment";

type Params = {
  userId: string;
  article: Article;
};

export function useArticleDetail({ userId, article }: Params) {
  const router = useRouter();
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpenState] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteInFlightRef = useRef(false);
  const articleComment = useArticleComment({ userId, article });

  const setDeleteDialogOpen = (open: boolean) => {
    if (open) {
      setDeleteError(null);
    }
    setDeleteDialogOpenState(open);
  };

  const handleDelete = async () => {
    if (deleteInFlightRef.current) return;

    deleteInFlightRef.current = true;
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/users/${userId}/articles/${article.articleId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        setDeleteError(errorMessage);
        toast.error("記事を削除できませんでした", {
          description: errorMessage,
        });
        return;
      }

      toast.success("記事を削除しました", {
        description: article.title,
      });
      setDeleteDialogOpenState(false);
      router.push(`/users/${userId}/articles`);
      router.refresh();
    } catch {
      setDeleteError(DEFAULT_ERROR_MESSAGE);
      toast.error("記事を削除できませんでした", {
        description: DEFAULT_ERROR_MESSAGE,
      });
    } finally {
      deleteInFlightRef.current = false;
      setIsDeleting(false);
    }
  };

  const handleScrollToComment = () => {
    commentSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return {
    userId,
    article: {
      ...article,
      comment: articleComment.comment,
    },
    deleteDialogOpen,
    deleteError,
    isDeleting,
    commentSectionRef,
    isCommentEditing: articleComment.isEditing,
    commentInput: articleComment.input,
    commentError: articleComment.error,
    isCommentSaving: articleComment.isSaving,
    setDeleteDialogOpen,
    setCommentInput: articleComment.setInput,
    handleDelete,
    handleScrollToComment,
    handleStartCommentEditing: articleComment.handleStartEditing,
    handleCancelCommentEditing: articleComment.handleCancelEditing,
    handleSaveComment: articleComment.handleSave,
  };
}
