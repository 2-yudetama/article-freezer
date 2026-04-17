"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  ArticleListItem,
  ArticleListSortOption,
  ArticleListTag,
} from "@/features/articles/list/common";
import { useArticleList } from "@/features/articles/list/hooks/use-article-list";
import ArticleGrid from "@/features/articles/list/ui/article-grid";
import ArticleList from "@/features/articles/list/ui/article-list";
import ArticleListControls from "@/features/articles/list/ui/article-list-controls";
import ArticleTagFilter from "@/features/articles/list/ui/article-tag-filter";

type ArticlesPageClientProps = {
  articles: ArticleListItem[];
  availableTags: ArticleListTag[];
  selectedTagIds: string[];
  sortOption: ArticleListSortOption;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  errorMessage?: string;
};

/** 記事一覧ページの状態管理と表示をつなぐ関数 */
export default function ArticlesPageClient({
  articles,
  availableTags,
  selectedTagIds,
  sortOption,
  currentPage,
  totalPages,
  totalCount,
  errorMessage,
}: ArticlesPageClientProps) {
  const articlesPage = useArticleList({
    articles,
    availableTags,
    selectedTagIds,
    sortOption,
    currentPage,
    totalPages,
    totalCount,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-bold mb-2">記事一覧</h1>
        <p className="text-muted-foreground">
          {articlesPage.filteredCount}件の記事が見つかりました
        </p>
      </div>

      <ArticleTagFilter
        tags={articlesPage.availableTags}
        selectedTags={articlesPage.selectedTags}
        onToggleTag={articlesPage.toggleTag}
        onClear={articlesPage.clearTags}
      />

      <ArticleListControls
        viewMode={articlesPage.viewMode}
        sortOption={articlesPage.sortOption}
        onViewModeChange={articlesPage.setViewMode}
        onSortChange={articlesPage.setSortOption}
      />

      {errorMessage ? (
        <Card className="p-12 text-center">
          <p className="text-destructive">{errorMessage}</p>
        </Card>
      ) : articlesPage.articles.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">記事が見つかりませんでした</p>
        </Card>
      ) : articlesPage.viewMode === "grid" ? (
        <ArticleGrid
          userId={articlesPage.userId}
          articles={articlesPage.articles}
        />
      ) : (
        <ArticleList
          userId={articlesPage.userId}
          articles={articlesPage.articles}
        />
      )}

      {articlesPage.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              articlesPage.setCurrentPage(
                Math.max(1, articlesPage.currentPage - 1),
              )
            }
            disabled={articlesPage.currentPage === 1 || articlesPage.isPending}
          >
            前へ
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {articlesPage.currentPage} / {articlesPage.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              articlesPage.setCurrentPage(
                Math.min(articlesPage.totalPages, articlesPage.currentPage + 1),
              )
            }
            disabled={
              articlesPage.currentPage === articlesPage.totalPages ||
              articlesPage.isPending
            }
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  );
}
