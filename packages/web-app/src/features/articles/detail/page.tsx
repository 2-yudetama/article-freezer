"use client";

import { useArticleDetail } from "@/features/articles/detail/hooks/use-article-detail";
import ArticleDetailPageView from "@/features/articles/detail/ui/page-view";

/** 記事詳細ページを表示する関数 */
export default function ArticleDetailPage() {
  const articleDetailPage = useArticleDetail();

  return <ArticleDetailPageView {...articleDetailPage} />;
}
