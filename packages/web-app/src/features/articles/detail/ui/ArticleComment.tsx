"use client";

import { MarkdownPreview } from "@/components/markdown-preview";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/domain/articles";
import { formatDateTimeInTokyo } from "@/lib/utils/data-format";

/** 記事コメントを表示する関数 */
export default function ArticleComment({
  comment,
}: {
  comment: Article["comment"];
}) {
  if (!comment?.comment) {
    return null;
  }

  const updatedAtLabel = formatDateTimeInTokyo(comment.updatedAt);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>コメント</span>
          <Badge variant="outline" className="text-xs font-normal">
            あなたの感想
          </Badge>
        </h2>
        <p className="text-sm text-muted-foreground">
          更新日時：{updatedAtLabel}
        </p>
      </div>
      <div className="border-l-4 border-primary">
        <MarkdownPreview
          content={comment.comment}
          cardClassName="rounded-none"
        />
      </div>
    </div>
  );
}
