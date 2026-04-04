"use client";

import { ExternalLink } from "lucide-react";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { ExtractedArticleMock } from "@/lib/mock-data";
import StepNavigation from "./StepNavigation";

type ExtractResultStepCardProps = {
  url: string;
  extractedArticle: ExtractedArticleMock;
  onBack: () => void;
  onNext: () => void;
};

/**
 * 抽出した記事内容を確認するステップ。
 * タイトル・公開日・元URL・本文プレビューを表示する。
 */
export default function ExtractResultStepCard({
  url,
  extractedArticle,
  onBack,
  onNext,
}: ExtractResultStepCardProps) {
  const publishedDateLabel = extractedArticle.publishedDate ?? "公開日不明";

  return (
    <Card>
      <CardHeader>
        <CardTitle>抽出結果を確認</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="space-y-4">
            <Label className="text-muted-foreground">本文プレビュー</Label>
            <MarkdownPreview
              content={extractedArticle.content}
              contentClassName="max-h-76 overflow-y-auto"
            />
          </div>
        </div>
        <StepNavigation onBack={onBack} onNext={onNext} />
      </CardContent>
    </Card>
  );
}
