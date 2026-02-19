"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ArticleGrid from "@/features/articles/shared/ui/article-grid";
import ArticleList from "@/features/articles/shared/ui/article-list";
import ArticleListControls from "@/features/articles/shared/ui/article-list-controls";
import ArticleTagFilter from "@/features/articles/shared/ui/article-tag-filter";
import type { Article, ArticleTag, SortOption, ViewMode } from "@/lib/types";

type ArticlesPageViewProps = {
  userId: string;
  availableTags: ArticleTag[];
  paginatedArticles: Article[];
  filteredCount: number;
  viewMode: ViewMode;
  sortOption: SortOption;
  selectedTags: string[];
  currentPage: number;
  totalPages: number;
  deleteDialogOpen: boolean;
  setViewMode: (value: ViewMode) => void;
  setSortOption: (value: SortOption) => void;
  setCurrentPage: (value: number) => void;
  setDeleteDialogOpen: (value: boolean) => void;
  toggleTag: (tagId: string) => void;
  clearTags: () => void;
  openDeleteDialog: (articleId: string) => void;
  handleDeleteArticle: () => void;
};

/** 記事一覧ページのUIを表示する関数 */
export default function ArticlesPageView({
  userId,
  availableTags,
  paginatedArticles,
  filteredCount,
  viewMode,
  sortOption,
  selectedTags,
  currentPage,
  totalPages,
  deleteDialogOpen,
  setViewMode,
  setSortOption,
  setCurrentPage,
  setDeleteDialogOpen,
  toggleTag,
  clearTags,
  openDeleteDialog,
  handleDeleteArticle,
}: ArticlesPageViewProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">記事一覧</h1>
        <p className="text-muted-foreground">
          {filteredCount}件の記事が見つかりました
        </p>
      </div>

      <ArticleTagFilter
        tags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        onClear={clearTags}
      />

      <ArticleListControls
        viewMode={viewMode}
        sortOption={sortOption}
        onViewModeChange={setViewMode}
        onSortChange={setSortOption}
      />

      {paginatedArticles.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">記事が見つかりませんでした</p>
        </Card>
      ) : viewMode === "grid" ? (
        <ArticleGrid
          userId={userId}
          articles={paginatedArticles}
          onDelete={openDeleteDialog}
        />
      ) : (
        <ArticleList
          userId={userId}
          articles={paginatedArticles}
          onDelete={openDeleteDialog}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            前へ
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            次へ
          </Button>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。記事を完全に削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteArticle}>
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
