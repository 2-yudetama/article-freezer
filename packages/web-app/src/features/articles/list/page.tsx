import { getArticlesListPageData } from "./api/list.actions";
import type { ArticleListSearchParams } from "./common";
import ArticlesPageClient from "./page-client";

/** 記事一覧ページに必要な初期データを取得してからUIを表示する */
export default async function ArticlesPage({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: ArticleListSearchParams;
}) {
  // サーバ側で記事を取得
  const articlesListPageData = await getArticlesListPageData({
    userId,
    searchParams,
  });

  return <ArticlesPageClient userId={userId} {...articlesListPageData} />;
}
