"use client";

import { useArticleTags } from "@/features/article-tags/hooks/use-article-tags";
import ArticleTagsPageView from "@/features/article-tags/ui/page-view";

/** 記事タグページを表示する関数 */
export default function ArticleTagsPage() {
  const articleTagsPage = useArticleTags();

  return <ArticleTagsPageView {...articleTagsPage} />;
}
