import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { Article } from "@/domain/articles";

type Params = {
  userId: string;
  article: Article;
};

export function useArticleDetail({ userId, article }: Params) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    toast.info("記事削除は未実装です", {
      description: article.title,
    });
    router.refresh();
  };

  return {
    userId,
    article,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDelete,
  };
}
