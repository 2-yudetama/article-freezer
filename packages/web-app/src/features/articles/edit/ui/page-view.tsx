"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { mockTags } from "@/lib/mock-data";
import type { Article } from "@/lib/types";

type ArticleEditPageViewProps = {
  userId: string;
  articleId: string;
  article: Article;
  onSave: () => void;
};

/** 記事編集ページのUIを表示する関数 */
export default function ArticleEditPageView({
  userId,
  articleId,
  article,
  onSave,
}: ArticleEditPageViewProps) {
  const [title, setTitle] = useState(article.title);
  const [summary, setSummary] = useState(article.summary);
  const [comment, setComment] = useState(article.comment || "");
  const [isFavorite, setIsFavorite] = useState(article.isFavorite);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    article.tags.map((tag) => tag.id),
  );

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={`/users/${userId}/articles/${articleId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              詳細に戻る
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">記事を編集</h1>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="記事のタイトル"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={article.url}
                disabled
                className="opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                URLは変更できません
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="favorite">お気に入り</Label>
                <p className="text-xs text-muted-foreground">
                  お気に入りに設定すると一覧で目立つように表示されます
                </p>
              </div>
              <Switch
                id="favorite"
                checked={isFavorite}
                onCheckedChange={setIsFavorite}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>要約</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="記事の要約を入力してください"
              rows={6}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>コメント</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="記事についての感想やメモを入力してください"
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>タグ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mockTags.map((tag) => (
                <Button
                  key={tag.id}
                  variant={
                    selectedTags.includes(tag.id) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6">
          <Link href={`/users/${userId}/articles/${articleId}`}>
            <Button variant="outline">キャンセル</Button>
          </Link>
          <Button onClick={onSave}>
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
