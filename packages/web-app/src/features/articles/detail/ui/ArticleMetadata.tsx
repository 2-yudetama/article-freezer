"use client";

import {
  Calendar,
  ExternalLink,
  MessageSquareText,
  Star,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Article } from "@/domain/articles";
import { formatDateInTokyo } from "@/lib/utils/data-format";

type ArticleMetadataProps = {
  userId: string;
  article: Article;
  onScrollToComment: () => void;
};

/** 記事詳細ページのメタ情報を表示する関数 */
export default function ArticleMetadata({
  userId,
  article,
  onScrollToComment,
}: ArticleMetadataProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-4">
        <Badge variant="secondary">
          {article.articleSource.type.toUpperCase()}
        </Badge>
        {article.isFavorite && (
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm">お気に入り</span>
          </div>
        )}
      </div>

      <h1 className="text-3xl md:text-4xl font-bold leading-tight">
        {article.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            投稿日：
            {article.publishedDate
              ? formatDateInTokyo(article.publishedDate)
              : "投稿日不明"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>保存日：{formatDateInTokyo(article.createdAt)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <Link
            key={tag.tagId}
            href={`/users/${userId}/articles?tag=${tag.tagId}`}
          >
            <Badge
              variant="outline"
              className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag.name}
            </Badge>
          </Link>
        ))}
      </div>

      <Card className="rounded-none py-4 border-l-4">
        <CardContent className="px-4">
          <div className="space-y-0">
            <p className="text-sm text-muted-foreground">元記事</p>
            <a
              href={article.articleSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-primary hover:underline font-medium flex items-center gap-2"
            >
              {article.articleSource.url}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={onScrollToComment}
      >
        <MessageSquareText className="w-4 h-4" />
        コメントへ移動
      </Button>
    </div>
  );
}
