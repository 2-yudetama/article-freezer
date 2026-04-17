"use client";

import { Grid, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ARTICLE_LIST_SORT_OPTIONS,
  type ArticleListSortOption,
  type ArticleListViewMode,
} from "@/features/articles/list/common";

type ArticleListControlsProps = {
  viewMode: ArticleListViewMode;
  sortOption: ArticleListSortOption;
  onViewModeChange: (value: ArticleListViewMode) => void;
  onSortChange: (value: ArticleListSortOption) => void;
};

/** 記事一覧の操作UIを表示する関数 */
export default function ArticleListControls({
  viewMode,
  sortOption,
  onViewModeChange,
  onSortChange,
}: ArticleListControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">表示形式</span>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) =>
            value && onViewModeChange(value as ArticleListViewMode)
          }
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
        <span className="text-sm text-muted-foreground">並び順</span>
        <Select
          value={sortOption}
          onValueChange={(value) =>
            onSortChange(value as ArticleListSortOption)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" position="popper">
            {ARTICLE_LIST_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
