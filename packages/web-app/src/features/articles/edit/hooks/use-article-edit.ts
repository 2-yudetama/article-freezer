import { notFound, useRouter } from "next/navigation";
import { use } from "react";
import { toast } from "sonner";
import { useUserId } from "@/components/providers/user-id-provider";
import { mockArticles } from "@/lib/mock-data";

type UseArticleEditResult = {
  userId: string;
  articleId: string;
  article: (typeof mockArticles)[number];
  handleSave: () => void;
};

export function useArticleEdit(
  params: Promise<{ article_id: string }>,
): UseArticleEditResult {
  const router = useRouter();
  const userId = useUserId();
  const { article_id } = use(params);
  const article = mockArticles.find((item) => item.id === article_id);

  if (!article) {
    notFound();
  }

  const handleSave = () => {
    toast.success("保存しました", {
      description: "記事の情報が更新されました",
    });
    router.push(`/users/${userId}/articles/${article_id}`);
  };

  return {
    userId,
    articleId: article_id,
    article,
    handleSave,
  };
}
