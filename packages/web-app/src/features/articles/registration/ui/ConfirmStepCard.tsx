"use client";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ArticleExtractResponse } from "@/lib/api/schemas";
import type { ArticleTag } from "@/lib/types";

type ConfirmStepCardProps = {
  url: string;
  extractedArticle: ArticleExtractResponse | null;
  selectedTags: string[];
  availableTags: ArticleTag[];
  comment: string;
  isLoading: boolean;
  onBack: () => void;
  onSave: () => Promise<void>;
};

/**
 * 保存直前の確認ステップ。
 * 抽出結果とユーザ入力をまとめて表示し、最終保存を実行する。
 */
export default function ConfirmStepCard({
  url,
  extractedArticle,
  selectedTags,
  availableTags,
  comment,
  isLoading,
  onBack,
  onSave,
}: ConfirmStepCardProps) {
  const publishedDateLabel = extractedArticle?.publishedDate ?? "公開日不明";
  const selectedTagItems = selectedTags
    .map((tagId) => availableTags.find((item) => item.id === tagId))
    .filter((tag): tag is ArticleTag => tag !== undefined);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>登録内容の確認</CardTitle>
          <CardDescription>
            以下の内容で問題なければ「登録」ボタンを押してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {extractedArticle && (
            <>
              <div className="space-y-2">
                <Label className="text-muted-foreground">タイトル</Label>
                <p className="font-medium">{extractedArticle.title}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">公開日</Label>
                <p className="font-medium">{publishedDateLabel}</p>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label className="text-muted-foreground">URL</Label>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-primary hover:underline inline-flex items-center gap-2"
            >
              <span>{url}</span>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">タグ</Label>
            {selectedTagItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedTagItems.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm md:text-base text-muted-foreground">なし</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">コメント</Label>
            {comment ? (
              <details className="space-y-4">
                <summary className="cursor-pointer font-medium">
                  コメントを表示
                </summary>
                <MarkdownPreview content={comment} />
              </details>
            ) : (
              <p className="text-sm md:text-base text-muted-foreground">なし</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">本文</Label>
            {extractedArticle?.content ? (
              <div className="flex flex-col items-start gap-4 py-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="default" size="lg">
                      <BookOpen className="h-4 w-4" />
                      本文を表示
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl">
                    <DialogHeader>
                      <DialogTitle>本文プレビュー</DialogTitle>
                    </DialogHeader>
                    <MarkdownPreview
                      content={extractedArticle.content}
                      cardClassName="overflow-hidden"
                      contentClassName="max-h-[72vh] overflow-y-auto scrollbar-readable"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <p className="text-sm md:text-base text-muted-foreground">なし</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>
        <Button onClick={onSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              登録中
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              登録
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
