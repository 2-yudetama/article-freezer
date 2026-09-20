"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { memo, useState } from "react";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

const ArticleEditMarkdownPreview = memo(function ArticleEditMarkdownPreview({
  content,
}: {
  content: string;
}) {
  return <MarkdownPreview content={content} />;
});

/** 記事編集ページの UI を表示する関数 */
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
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <form
      className="container mx-auto flex min-h-0 max-w-full flex-col overflow-hidden h-[calc(100dvh-8rem)] md:h-screen"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
    >
      <header className="shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link href={`/users/${userId}/articles/${article.articleId}`}>
              <Button variant="ghost" size="sm" className="mb-3">
                <ArrowLeft className="w-4 h-4 mr-2" />
                詳細に戻る
              </Button>
            </Link>
            <h1 className="text-3xl font-bold sm:text-4xl">記事を編集</h1>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
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
        </div>

        {error && (
          <p
            className="mx-auto w-full max-w-4xl px-4 pb-4 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-readable">
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
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
              <CardTitle id="content-heading">本文（Markdown）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                id="content"
                aria-labelledby="content-heading"
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="記事本文を Markdown で入力してください"
                rows={16}
                disabled={isSaving}
              />
              <Collapsible
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                className="space-y-3"
              >
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline">
                    {previewOpen ? "プレビューを閉じる" : "プレビューを表示"}
                  </Button>
                </CollapsibleTrigger>
                {previewOpen && (
                  <CollapsibleContent>
                    <div className="space-y-2">
                      <h2 className="text-sm font-medium">プレビュー</h2>
                      <ArticleEditMarkdownPreview content={content} />
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
