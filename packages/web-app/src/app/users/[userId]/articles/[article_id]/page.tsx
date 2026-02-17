"use client";

import {
  ArrowLeft,
  Calendar,
  Edit,
  ExternalLink,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MarkdownPreview } from "@/components/markdown-preview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockArticles } from "@/lib/mock-data";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const article_id = params.article_id as string;
  const article = mockArticles.find((a) => a.id === article_id);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!article) {
    notFound();
  }

  const handleDelete = () => {
    toast.success("記事を削除しました", {
      description: article.title,
    });
    router.push("/articles");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 上部ナビゲーション */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mx-4 px-4 py-4 mb-6 border-b border-border">
        <div className="flex items-center justify-between">
          <Link href="/articles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              一覧に戻る
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                元記事
              </Button>
            </a>
            <Link href={`/articles/${article.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                編集
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              削除
            </Button>
          </div>
        </div>
      </div>

      {/* 記事情報 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary">{article.sourcePlatform}</Badge>
          {article.isFavorite && (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm">お気に入り</span>
            </div>
          )}
        </div>

        <h1 className="text-4xl font-bold mb-4 leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              公開日:{" "}
              {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              登録日: {new Date(article.createdAt).toLocaleDateString("ja-JP")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {article.tags.map((tag) => (
            <Link key={tag.id} href={`/articles?tag=${tag.id}`}>
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
      </div>

      {/* 元記事のリンク */}
      <Card className="mb-6 border-primary/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">元記事</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium flex items-center gap-2"
              >
                {article.url}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 要約 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">要約</h2>
        <MarkdownPreview content={article.summary} />
      </div>

      {/* コメント */}
      {article.comment && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>コメント</span>
            <Badge variant="outline" className="text-xs font-normal">
              あなたの感想
            </Badge>
          </h2>
          <div className="border-l-4 border-primary pl-4">
            <MarkdownPreview content={article.comment} />
          </div>
        </div>
      )}

      <Separator className="my-8" />

      {/* 関連記事 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">関連記事</h2>
        <div className="grid gap-4">
          {mockArticles
            .filter(
              (a) =>
                a.id !== article.id &&
                a.tags.some((tag) => article.tags.some((t) => t.id === tag.id)),
            )
            .slice(0, 3)
            .map((relatedArticle) => (
              <Link
                key={relatedArticle.id}
                href={`/articles/${relatedArticle.id}`}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 hover:text-primary transition-colors">
                          {relatedArticle.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {relatedArticle.summary}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {relatedArticle.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs whitespace-nowrap"
                      >
                        {relatedArticle.sourcePlatform}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。記事を完全に削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
