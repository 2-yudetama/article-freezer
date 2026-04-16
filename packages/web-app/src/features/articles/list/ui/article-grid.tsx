"use client";

import { ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ArticleListItem } from "@/features/articles/list/common/types";

type ArticleGridProps = {
  userId: string;
  articles: ArticleListItem[];
};

/** 記事グリッドを表示する関数 */
export default function ArticleGrid({ userId, articles }: ArticleGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {articles.map((article) => (
        <Card
          key={article.articleId}
          className="group hover:shadow-lg transition-shadow"
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {article.sourceLabel}
                </Badge>
                {article.isFavorite && (
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                )}
              </div>
            </div>
            <CardTitle className="line-clamp-2 leading-snug">
              <Link
                href={`/users/${userId}/articles/${article.articleId}`}
                className="hover:text-primary transition-colors"
              >
                {article.title}
              </Link>
            </CardTitle>
            <CardDescription className="text-xs">
              {article.publishedDate
                ? new Date(article.publishedDate).toLocaleDateString("ja-JP")
                : "公開日不明"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {article.contentPreview || "本文がありません"}
            </p>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Badge key={tag.tagId} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
              >
                <Link href={`/users/${userId}/articles/${article.articleId}`}>
                  詳細を見る
                </Link>
              </Button>
              {article.url && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  aria-label="元記事を開く"
                >
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
