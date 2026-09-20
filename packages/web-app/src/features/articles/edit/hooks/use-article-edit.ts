import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Article } from "@/domain/articles";
import {
  DEFAULT_ERROR_MESSAGE,
  getApiErrorMessage,
} from "@/lib/api/response.shared";

type UseArticleEditResult = {
  userId: string;
  article: Article;
  title: string;
  content: string;
  error: string | null;
  isSaving: boolean;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
};

export function useArticleEdit({
  userId,
  article,
}: {
  userId: string;
  article: Article;
}): UseArticleEditResult {
  const router = useRouter();
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveInFlightRef = useRef(false);

  const handleSave = async () => {
    if (saveInFlightRef.current) return;

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setError("タイトルを入力してください");
      return;
    }
    if (normalizedTitle.length > 255) {
      setError("タイトルは255文字以内で入力してください");
      return;
    }
    if (!content.trim()) {
      setError("本文を入力してください");
      return;
    }

    saveInFlightRef.current = true;
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/users/${userId}/articles/${article.articleId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
          }),
        },
      );

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        setError(errorMessage);
        toast.error("記事を保存できませんでした", {
          description: errorMessage,
        });
        return;
      }

      toast.success("記事を保存しました");
      router.push(`/users/${userId}/articles/${article.articleId}`);
      router.refresh();
    } catch {
      setError(DEFAULT_ERROR_MESSAGE);
      toast.error("記事を保存できませんでした", {
        description: DEFAULT_ERROR_MESSAGE,
      });
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (saveInFlightRef.current) return;
    router.push(`/users/${userId}/articles/${article.articleId}`);
  };

  return {
    userId,
    article,
    title,
    content,
    error,
    isSaving,
    setTitle,
    setContent,
    handleSave,
    handleCancel,
  };
}
