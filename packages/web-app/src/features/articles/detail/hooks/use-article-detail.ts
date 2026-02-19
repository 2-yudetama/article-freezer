import { notFound, useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useUserId } from "@/components/providers/user-id-provider";
import { mockArticles } from "@/lib/mock-data";

type UseArticleDetailResult = {
  userId: string;
  article: (typeof mockArticles)[number];
  relatedArticles: (typeof mockArticles)[number][];
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (value: boolean) => void;
  handleDelete: () => void;
};

export function useArticleDetail(): UseArticleDetailResult {
  const params = useParams();
  const router = useRouter();
  const userId = useUserId();
  const articleId = params.article_id as string;
  const article = mockArticles.find((a) => a.id === articleId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!article) {
    notFound();
  }

  const relatedArticles = useMemo(() => {
    return mockArticles
      .filter(
        (item) =>
          item.id !== article.id &&
          item.tags.some((tag) => article.tags.some((t) => t.id === tag.id)),
      )
      .slice(0, 3);
  }, [article]);

  const handleDelete = () => {
    toast.success("記事を削除しました", {
      description: article.title,
    });
    router.push(`/users/${userId}/articles`);
  };

  return {
    userId,
    article,
    relatedArticles,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDelete,
  };
}
