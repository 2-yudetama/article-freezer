import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Article } from "@/domain/articles";
import { saveArticleComment } from "@/features/articles/detail/api/comment.actions";

type Params = {
  userId: string;
  article: Article;
};

const COMMENT_MAX_LENGTH = 1000;

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

    if (normalizedComment.length > COMMENT_MAX_LENGTH) {
      setCommentError("コメントは1000文字以内で入力してください");
      return;
    }

    setCommentError(null);
    setIsCommentSaving(true);

    try {
      const result = await saveArticleComment({
        userId,
        articleId: article.articleId,
        comment: normalizedComment,
      });

      if (!result.success) {
        setCommentError(result.error);
        toast.error("コメントを保存できませんでした", {
          description: result.error,
        });
        return;
      }

      setArticleComment(result.comment);
      setCommentInput(result.comment.comment);
      setIsCommentEditing(false);
      toast.success("コメントを保存しました");
      router.refresh();
    } catch {
      const errorMessage = "コメントを保存できませんでした";
      setCommentError(errorMessage);
      toast.error(errorMessage);
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
