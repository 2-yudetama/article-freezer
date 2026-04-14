"use client";

import { BookOpen, ExternalLink, Loader2, RefreshCcw } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ArticleExtractResponse } from "@/features/articles/shared/api";
import StepNavigation from "./StepNavigation";

type ExtractResultStepCardProps = {
  url: string;
  extractedArticle: ArticleExtractResponse;
  isLoading: boolean;
  onBack: () => void;
  onReExtract: () => Promise<void>;
  onNext: () => void;
};

/**
 * 抽出した記事内容を確認するステップ。
 * タイトル・公開日・元URL・本文プレビューを表示する。
 */
export default function ExtractResultStepCard({
  url,
  extractedArticle,
  isLoading,
  onBack,
  onReExtract,
  onNext,
}: ExtractResultStepCardProps) {
  const publishedDateLabel = extractedArticle.publishedDate ?? "公開日不明";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>抽出結果を確認</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">タイトル</Label>
              <p className="font-medium">{extractedArticle.title}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">公開日</Label>
              <p className="font-medium">{publishedDateLabel}</p>
            </div>
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
              <Label className="text-muted-foreground">本文プレビュー</Label>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          再抽出中
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="h-4 w-4" />
                          再抽出
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        記事を再抽出しますか？
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        現在の抽出結果を上書きして、URLから記事本文を再取得します
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction onClick={onReExtract}>
                        再抽出
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        backDisabled={isLoading}
        nextDisabled={isLoading}
      />
    </div>
  );
}
