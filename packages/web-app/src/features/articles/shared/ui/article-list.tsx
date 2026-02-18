"use client";

import { ExternalLink, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Article } from "@/lib/types";

type ArticleListProps = {
  userId: string;
  articles: Article[];
  onDelete: (articleId: string) => void;
};

/** 記事リストを表示する関数 */
export default function ArticleList({
  userId,
  articles,
  onDelete,
}: ArticleListProps) {
  return (
    <div className="space-y-4 mb-8">
      {articles.map((article) => (
        <Card key={article.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">
                    {article.sourcePlatform}
                  </Badge>
                  {article.isFavorite && (
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <h3 className="text-xl font-semibold">
                  <Link
                    href={`/users/${userId}/articles/${article.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {article.title}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex md:flex-col gap-2 md:justify-center">
                <Link
                  href={`/users/${userId}/articles/${article.id}`}
                  className="flex-1 md:flex-initial"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                  >
                    詳細を見る
                  </Button>
                </Link>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-initial"
                >
                  <Button variant="ghost" size="sm" className="w-full">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(article.id)}
                  className="flex-1 md:flex-initial"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
