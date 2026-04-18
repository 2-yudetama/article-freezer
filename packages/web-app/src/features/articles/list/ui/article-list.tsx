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
import type { ArticleListItem } from "@/features/articles/list/common";

/** 記事リストを表示する関数 */
export default function ArticleList({
  userId,
  articles,
}: {
  userId: string;
  articles: ArticleListItem[];
}) {
  return (
    <div className="space-y-6 mb-8">
      {articles.map((article) => (
        <Card
          key={article.articleId}
          className="group hover:shadow-lg transition-shadow py-4 gap-4"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {article.articleSource.type.toUpperCase()}
                </Badge>
                {article.isFavorite && (
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                )}
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="bg-transparent"
                aria-label="元記事を開く"
              >
                <Link
                  href={article.articleSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  原文
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </Button>
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
                : "投稿日不明"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {article.content || "本文がありません"}
            </p>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Badge key={tag.tagId} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
