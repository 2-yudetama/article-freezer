"use client";

import { useArticleEdit } from "@/features/articles/edit/hooks/use-article-edit";
import ArticleEditPageView from "@/features/articles/edit/ui/page-view";

/** 記事編集ページを表示する関数 */
export default function ArticleEditPage({
  params,
}: {
  params: Promise<{ article_id: string }>;
}) {
  const articleEditPage = useArticleEdit(params);

  return (
    <ArticleEditPageView
      userId={articleEditPage.userId}
      articleId={articleEditPage.articleId}
      article={articleEditPage.article}
      onSave={articleEditPage.handleSave}
    />
  );
}
