"use client";

import { MarkdownPreview } from "@/components/markdown-preview";
import type { Article } from "@/domain/articles";

/** 記事本文を表示する関数 */
export default function ArticleContent({
  content,
}: {
  content: Article["content"];
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">本文</h2>
      <MarkdownPreview content={content} />
    </div>
  );
}
