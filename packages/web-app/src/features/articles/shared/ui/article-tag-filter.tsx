"use client";

import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ArticleTag } from "@/lib/types";

type ArticleTagFilterProps = {
  tags: ArticleTag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onClear: () => void;
};

/** 記事タグの絞り込みUIを表示する関数 */
export default function ArticleTagFilter({
  tags,
  selectedTags,
  onToggleTag,
  onClear,
}: ArticleTagFilterProps) {
  return (
    <Collapsible className="mb-6">
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">タグで絞り込み</CardTitle>
              {selectedTags.length > 0 && (
                <Badge variant="secondary">{selectedTags.length}件選択中</Badge>
              )}
            </div>
            <ChevronDown className="w-5 h-5 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  variant={
                    selectedTags.includes(tag.id) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => onToggleTag(tag.id)}
                >
                  {tag.name}
                </Button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="mt-4"
              >
                すべてクリア
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
