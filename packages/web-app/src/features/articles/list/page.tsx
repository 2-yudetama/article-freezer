import { getLogger } from "@logtape/logtape";
import { DataIntegrityError } from "@/lib/errors";
import { getArticlesListPageData } from "./api/list.actions";
import type { ArticleListSearchParams } from "./common";
import ArticlesPageClient from "./page-client";

const logger = getLogger(["web-app", "articles", "list"]);

/** 記事一覧ページに必要な初期データを取得してからUIを表示する */
export default async function ArticlesPage({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: ArticleListSearchParams;
}) {
  try {
    // サーバ側で記事を取得
    const articlesListPageData = await getArticlesListPageData({
      userId,
      searchParams,
    });

    return <ArticlesPageClient {...articlesListPageData} />;
  } catch (error) {
    const errorMessage =
      error instanceof DataIntegrityError
        ? "記事一覧の取得に失敗しました"
        : "内部サーバエラーが発生しました";

    logger.error("Failed to load articles list page", {
      userId,
      sortOption: searchParams.sortOption,
      selectedTagIds: searchParams.selectedTagIds,
      errorName: error instanceof Error ? error.name : "Error",
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return (
      <ArticlesPageClient
        articles={[]}
        availableTags={[]}
        selectedTagIds={searchParams.selectedTagIds}
        sortOption={searchParams.sortOption}
        currentPage={1}
        totalPages={0}
        totalCount={0}
        errorMessage={errorMessage}
      />
    );
  }
}
