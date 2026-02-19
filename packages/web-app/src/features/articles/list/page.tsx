"use client";

import { useArticles } from "@/features/articles/list/hooks/use-articles";
import ArticlesPageView from "@/features/articles/list/ui/page-view";

/** 記事一覧ページを表示する関数 */
export default function ArticlesPage() {
  const articlesPage = useArticles();

  return <ArticlesPageView {...articlesPage} />;
}
