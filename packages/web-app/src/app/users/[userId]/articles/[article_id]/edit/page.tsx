"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { mockArticles, mockTags } from "@/lib/mock-data";
import { useUserId } from "../../../userIdProvider";

export default function ArticleEditPage({
  params,
}: {
  params: Promise<{ article_id: string }>;
}) {
  const router = useRouter();
  const userId = useUserId();
  const { article_id } = use(params);
  const article = mockArticles.find((a) => a.id === article_id);

  const [title, setTitle] = useState(article?.title || "");
  const [summary, setSummary] = useState(article?.summary || "");
  const [comment, setComment] = useState(article?.comment || "");
  const [isFavorite, setIsFavorite] = useState(article?.isFavorite || false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    article?.tags.map((t) => t.id) || [],
  );

  if (!article) {
    notFound();
  }

  const handleSave = () => {
    // モックなので実際には保存しない
    toast.success("保存しました", {
      description: "記事の情報が更新されました",
    });
    router.push(`/users/${userId}/articles/${article_id}`);
  };

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
          <Link href={`/users/${userId}/articles/${article_id}`}>
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
          <Link href={`/users/${userId}/articles/${article_id}`}>
            <Button variant="outline">キャンセル</Button>
          </Link>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
