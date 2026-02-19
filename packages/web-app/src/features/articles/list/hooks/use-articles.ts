import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useUserId } from "@/components/providers/user-id-provider";
import { mockArticles, mockTags } from "@/lib/mock-data";
import type { Article, SortOption, ViewMode } from "@/lib/types";

type UseArticlesResult = {
  userId: string;
  availableTags: typeof mockTags;
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

export function useArticles(): UseArticlesResult {
  const userId = useUserId();
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const itemsPerPage = 9;

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    if (selectedTags.length > 0) {
      filtered = filtered.filter((article) =>
        article.tags.some((tag) => selectedTags.includes(tag.id)),
      );
    }

    switch (sortOption) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title, "ja"));
        break;
    }

    return filtered;
  }, [articles, selectedTags, sortOption]);

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
    setCurrentPage(1);
  };

  const clearTags = () => {
    setSelectedTags([]);
    setCurrentPage(1);
  };

  const openDeleteDialog = (articleId: string) => {
    setArticleToDelete(articleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteArticle = () => {
    if (!articleToDelete) {
      return;
    }

    const article = articles.find((a) => a.id === articleToDelete);
    setArticles(articles.filter((a) => a.id !== articleToDelete));
    setCurrentPage(1);
    setDeleteDialogOpen(false);
    setArticleToDelete(null);

    toast.success("記事を削除しました", {
      description: article?.title,
    });
  };

  return {
    userId,
    availableTags: mockTags,
    paginatedArticles,
    filteredCount: filteredArticles.length,
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
  };
}
