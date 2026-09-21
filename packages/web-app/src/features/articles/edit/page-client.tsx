"use client";

import type { Article } from "@/domain/articles";
import { useArticleEdit } from "@/features/articles/edit/hooks/use-article-edit";
import ArticleEditPageView from "@/features/articles/edit/ui/ArticleEditPageView";

type ArticleEditPageClientProps = {
  userId: string;
  article: Article;
};

/** 記事編集ページの状態管理と表示をつなぐ関数 */
export default function ArticleEditPageClient({
  userId,
  article,
}: ArticleEditPageClientProps) {
  const articleEditPage = useArticleEdit({ userId, article });

  return (
    <ArticleEditPageView
      userId={articleEditPage.userId}
      article={articleEditPage.article}
      title={articleEditPage.title}
      content={articleEditPage.content}
      error={articleEditPage.error}
      isSaving={articleEditPage.isSaving}
      onTitleChange={articleEditPage.setTitle}
      onContentChange={articleEditPage.setContent}
      onSave={articleEditPage.handleSave}
      onCancel={articleEditPage.handleCancel}
    />
  );
}
