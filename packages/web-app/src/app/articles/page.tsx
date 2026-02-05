"use client";

import {
  ChevronDown,
  ExternalLink,
  Grid,
  List,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { mockArticles, mockTags } from "@/lib/mock-data";
import type { SortOption, ViewMode } from "@/lib/types";

export default function ArticlesPage() {
  const [articles, setArticles] = useState(mockArticles);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const itemsPerPage = 9;

  // 削除処理
  const handleDeleteArticle = () => {
    if (articleToDelete) {
      const article = articles.find((a) => a.id === articleToDelete);
      setArticles(articles.filter((a) => a.id !== articleToDelete));
      setDeleteDialogOpen(false);
      setArticleToDelete(null);

      toast.success("記事を削除しました", {
        description: article?.title,
      });
    }
  };

  const openDeleteDialog = (articleId: string) => {
    setArticleToDelete(articleId);
    setDeleteDialogOpen(true);
  };

  // フィルタリングとソート
  let filteredArticles = [...articles];

  if (selectedTags.length > 0) {
    filteredArticles = filteredArticles.filter((article) =>
      article.tags.some((tag) => selectedTags.includes(tag.id)),
    );
  }

  switch (sortOption) {
    case "newest":
      filteredArticles.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "oldest":
      filteredArticles.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      break;
    case "title":
      filteredArticles.sort((a, b) => a.title.localeCompare(b.title, "ja"));
      break;
  }

  // ページネーション
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArticles = filteredArticles.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
    setCurrentPage(1); // タグ変更時は1ページ目に戻る
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">記事一覧</h1>
        <p className="text-muted-foreground">
          {filteredArticles.length}件の記事が見つかりました
        </p>
      </div>

      {/* タグフィルター */}
      <Collapsible className="mb-6">
        <Card>
          <CardHeader>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">タグで絞り込み</CardTitle>
                {selectedTags.length > 0 && (
                  <Badge variant="secondary">
                    {selectedTags.length}件選択中
                  </Badge>
                )}
              </div>
              <ChevronDown className="w-5 h-5 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mockTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant={
                      selectedTags.includes(tag.id) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="mt-4"
                >
                  すべてクリア
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* コントロールバー */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">表示形式:</span>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
          >
            <ToggleGroupItem value="grid" aria-label="グリッド表示">
              <Grid className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="リスト表示">
              <List className="w-4 h-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">並び順:</span>
          <Select
            value={sortOption}
            onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">新しい順</SelectItem>
              <SelectItem value="oldest">古い順</SelectItem>
              <SelectItem value="title">タイトル順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 記事一覧 */}
      {paginatedArticles.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">記事が見つかりませんでした</p>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedArticles.map((article) => (
            <Card
              key={article.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.sourcePlatform}
                    </Badge>
                    {article.isFavorite && (
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(article.id)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="line-clamp-2 leading-snug">
                  <Link
                    href={`/articles/${article.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {article.title}
                  </Link>
                </CardTitle>
                <CardDescription className="text-xs">
                  {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {article.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Link href={`/articles/${article.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                    >
                      詳細を見る
                    </Button>
                  </Link>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="ghost" size="sm" className="w-full">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {paginatedArticles.map((article) => (
            <Card
              key={article.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {article.sourcePlatform}
                      </Badge>
                      {article.isFavorite && (
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.publishedAt).toLocaleDateString(
                          "ja-JP",
                        )}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold">
                      <Link
                        href={`/articles/${article.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 md:justify-center">
                    <Link
                      href={`/articles/${article.id}`}
                      className="flex-1 md:flex-initial"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                      >
                        詳細を見る
                      </Button>
                    </Link>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-initial"
                    >
                      <Button variant="ghost" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(article.id)}
                      className="flex-1 md:flex-initial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            次へ
          </Button>
        </div>
      )}

      {/* 削除確認ダイアログ */}
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
