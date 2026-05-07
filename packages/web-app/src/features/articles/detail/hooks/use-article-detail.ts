import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Article } from "@/domain/articles";
import { useArticleComment } from "./use-article-comment";

type Params = {
  userId: string;
  article: Article;
};

export function useArticleDetail({ userId, article }: Params) {
  const router = useRouter();
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const articleComment = useArticleComment({ userId, article });

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

  return {
    userId,
    article: {
      ...article,
      comment: articleComment.comment,
    },
    deleteDialogOpen,
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
