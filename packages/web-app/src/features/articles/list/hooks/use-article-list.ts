import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useUserId } from "@/components/providers/user-id-provider";
import type {
  ArticleListItem,
  ArticleListSortOption,
  ArticleListTag,
  ArticleListViewMode,
} from "@/features/articles/list/common";
import { setPageParam } from "@/lib/pagination/client";

type Params = {
  articles: ArticleListItem[];
  availableTags: ArticleListTag[];
  selectedTagIds: string[];
  sortOption: ArticleListSortOption;
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

export function useArticleList({
  articles,
  availableTags,
  selectedTagIds,
  sortOption,
  currentPage,
  totalPages,
  totalCount,
}: Params) {
  const userId = useUserId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ArticleListViewMode>("grid");
  const previousPageRef = useRef(currentPage);

  useEffect(() => {
    if (previousPageRef.current !== currentPage) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      previousPageRef.current = currentPage;
    }
  }, [currentPage]);

  const updateSearchParams = (updater: (params: URLSearchParams) => void) => {
    const nextParams = new URLSearchParams(searchParams);
    updater(nextParams);
    const query = nextParams.toString();

    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  };

  const setSortOption = (value: ArticleListSortOption) => {
    updateSearchParams((nextParams) => {
      if (value === "newest") {
        nextParams.delete("sort");
      } else {
        nextParams.set("sort", value);
      }
      setPageParam(nextParams, 1);
    });
  };

  const setCurrentPage = (value: number) => {
    updateSearchParams((nextParams) => {
      setPageParam(nextParams, value);
    });
  };

  const toggleTag = (tagId: string) => {
    updateSearchParams((nextParams) => {
      const nextSelectedTagIds = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId];

      nextParams.delete("tag");
      for (const selectedTagId of nextSelectedTagIds) {
        nextParams.append("tag", selectedTagId);
      }
      setPageParam(nextParams, 1);
    });
  };

  const clearTags = () => {
    updateSearchParams((nextParams) => {
      nextParams.delete("tag");
      setPageParam(nextParams, 1);
    });
  };

  return {
    userId,
    availableTags,
    articles,
    filteredCount: totalCount,
    viewMode,
    sortOption,
    selectedTags: selectedTagIds,
    currentPage,
    totalPages,
    isPending,
    setViewMode,
    setSortOption,
    setCurrentPage,
    toggleTag,
    clearTags,
  };
}
