"use client";

import { Eye, FileEdit } from "lucide-react";
import type { KeyboardEvent } from "react";
import { MarkdownPreview } from "@/components/markdown-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ArticleExtractResponse } from "@/features/articles/shared/api";
import StepNavigation from "./StepNavigation";

type CommentStepCardProps = {
  extractedArticle: ArticleExtractResponse | null;
  comment: string;
  onCommentChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
};

/**
 * ユーザの感想やメモを入力するステップ。
 * 参照用に抽出本文も折り畳み表示できる。
 */
export default function CommentStepCard({
  extractedArticle,
  comment,
  onCommentChange,
  onBack,
  onNext,
}: CommentStepCardProps) {
  const previewPanelClassName = "min-h-40 md:min-h-64";

  const handleCommentKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    const textarea = event.currentTarget;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const lineStart = comment.lastIndexOf("\n", selectionStart - 1) + 1;
    const currentLine = comment.slice(lineStart, selectionStart);
    const indent = currentLine.match(/^[\t ]*/)?.[0] ?? "";
    const insertText = `\n${indent}`;
    const nextComment =
      comment.slice(0, selectionStart) +
      insertText +
      comment.slice(selectionEnd);
    const nextCursorPosition = selectionStart + insertText.length;

    onCommentChange(nextComment);

    requestAnimationFrame(() => {
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>コメント</CardTitle>
          <CardDescription>
            記事についての感想やメモを入力してください（任意項目）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="edit">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">
                <FileEdit className="w-4 h-4 mr-2" />
                編集
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                プレビュー
              </TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="mt-4">
              <Textarea
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                className={`${previewPanelClassName} font-mono text-sm placeholder:text-sm md:text-sm md:placeholder:text-sm leading-normal mb-0.5`}
                placeholder="マークダウン記法が使用できます"
                rows={6}
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              {comment ? (
                <MarkdownPreview
                  content={comment}
                  cardClassName={previewPanelClassName}
                  contentClassName={previewPanelClassName}
                />
              ) : (
                <MarkdownPreview
                  content="プレビューする内容がありません"
                  cardClassName={previewPanelClassName}
                  contentClassName={`${previewPanelClassName} flex items-center justify-center p-12 text-center text-muted-foreground`}
                />
              )}
            </TabsContent>
          </Tabs>
          {extractedArticle && (
            <details className="space-y-4">
              <summary className="cursor-pointer font-medium">
                抽出した本文を表示
              </summary>
              <MarkdownPreview
                content={extractedArticle.content}
                cardClassName="overflow-hidden"
                contentClassName="max-h-80 overflow-y-auto"
              />
            </details>
          )}
        </CardContent>
      </Card>

      <StepNavigation onBack={onBack} onNext={onNext} />
    </div>
  );
}
