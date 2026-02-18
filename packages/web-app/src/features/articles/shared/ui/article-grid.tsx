"use client";

import { ExternalLink, Star, Trash2 } from "lucide-react";
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
import type { Article } from "@/lib/types";

type ArticleGridProps = {
  userId: string;
  articles: Article[];
  onDelete: (articleId: string) => void;
};

/** 記事グリッドを表示する関数 */
export default function ArticleGrid({
  userId,
  articles,
  onDelete,
}: ArticleGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {articles.map((article) => (
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
                onClick={() => onDelete(article.id)}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <CardTitle className="line-clamp-2 leading-snug">
              <Link
                href={`/users/${userId}/articles/${article.id}`}
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
              <Link href={`/users/${userId}/articles/${article.id}`}>
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
  );
}
