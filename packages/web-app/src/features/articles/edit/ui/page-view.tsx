"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Article } from "@/domain/articles";

type ArticleEditPageViewProps = {
  userId: string;
  article: Article;
  title: string;
  content: string;
  error: string | null;
  isSaving: boolean;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
};

/** 記事編集ページのUIを表示する関数 */
export default function ArticleEditPageView({
  userId,
  article,
  title,
  content,
  error,
  isSaving,
  onTitleChange,
  onContentChange,
  onSave,
  onCancel,
}: ArticleEditPageViewProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={`/users/${userId}/articles/${article.articleId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              詳細に戻る
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">記事を編集</h1>
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
      >
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
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="記事のタイトル"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={article.articleSource.url}
                disabled
                className="opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                URLは変更できません
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>本文（Markdown）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              id="content"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="記事本文を Markdown で入力してください"
              rows={16}
              disabled={isSaving}
            />
            <div className="space-y-2">
              <Label>プレビュー</Label>
              <MarkdownPreview content={content} />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onCancel}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "保存中…" : "保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}
