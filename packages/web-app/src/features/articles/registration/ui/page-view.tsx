"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileEdit,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ArticleTag, RegistrationStep } from "@/lib/types";

type ExtractedArticle = {
  title: string;
  publishedDate?: string;
  content: string;
};

type ArticleRegistrationPageViewProps = {
  userId: string;
  step: RegistrationStep;
  url: string;
  extractedArticle: ExtractedArticle | null;
  selectedTags: string[];
  comment: string;
  isLoading: boolean;
  steps: RegistrationStep[];
  currentStepIndex: number;
  progress: number;
  availableTags: ArticleTag[];
  setUrl: (value: string) => void;
  setComment: (value: string) => void;
  setStep: (value: RegistrationStep) => void;
  handleUrlSubmit: () => Promise<void>;
  handleExtractedArticleSubmit: () => void;
  handleCommentSubmit: () => void;
  handleTagsSubmit: () => void;
  handleSave: () => Promise<void>;
  toggleTag: (tagId: string) => void;
};

/** 記事登録ページのUIを表示する関数 */
export default function ArticleRegistrationPageView({
  userId,
  step,
  url,
  extractedArticle,
  selectedTags,
  comment,
  isLoading,
  steps,
  currentStepIndex,
  progress,
  availableTags,
  setUrl,
  setComment,
  setStep,
  handleUrlSubmit,
  handleExtractedArticleSubmit,
  handleCommentSubmit,
  handleTagsSubmit,
  handleSave,
  toggleTag,
}: ArticleRegistrationPageViewProps) {
  const publishedDateLabel = extractedArticle?.publishedDate ?? "公開日不明";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href={`/users/${userId}/articles`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            一覧に戻る
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-2">記事を登録</h1>
        <p className="text-muted-foreground">
          ステップ {currentStepIndex + 1} / {steps.length}
        </p>
      </div>

      <Progress value={progress} className="mb-8" />

      {step === "url" && (
        <Card>
          <CardHeader>
            <CardTitle>記事のURLを入力</CardTitle>
            <CardDescription>
              Zenn、Qiita、noteなどの記事URLを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://zenn.dev/..."
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUrlSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    取得中
                  </>
                ) : (
                  <>
                    次へ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "extract-result" && extractedArticle && (
        <Card>
          <CardHeader>
            <CardTitle>抽出結果を確認</CardTitle>
            <CardDescription>
              記事本文を取得しました。内容を確認して次へ進んでください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <Label className="text-muted-foreground">タイトル</Label>
                <p className="mt-1 font-medium">{extractedArticle.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">公開日</Label>
                <p className="mt-1">{publishedDateLabel}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">元URL</Label>
                <p className="mt-1 break-all text-sm">{url}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>本文プレビュー</Label>
              <div className="max-h-96 overflow-y-auto rounded-lg border p-4">
                <MarkdownPreview content={extractedArticle.content} />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("url")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
              <Button onClick={handleExtractedArticleSubmit}>
                次へ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "comment" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>コメント</CardTitle>
              <CardDescription>
                記事についての感想やメモを入力してください(任意、マークダウン対応)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {extractedArticle && (
                <details className="rounded-lg border p-4">
                  <summary className="cursor-pointer font-medium">
                    抽出した本文を表示
                  </summary>
                  <div className="mt-4 max-h-80 overflow-y-auto">
                    <MarkdownPreview content={extractedArticle.content} />
                  </div>
                </details>
              )}
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
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="この記事を読んで感じたことや、後で思い出したいポイントなど&#10;&#10;**太字**、*イタリック*、`コード`などのマークダウン記法が使えます"
                    rows={6}
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  {comment ? (
                    <MarkdownPreview content={comment} />
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center text-muted-foreground">
                        プレビューする内容がありません
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("extract-result")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
            <Button onClick={handleCommentSubmit}>
              次へ
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === "tags" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>タグを選択</CardTitle>
              <CardDescription>
                記事の内容に関連するタグを選択してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
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

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("comment")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
            <Button onClick={handleTagsSubmit}>
              次へ
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>登録内容の確認</CardTitle>
              <CardDescription>
                以下の内容で登録します。問題なければ「登録」ボタンを押してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">URL</Label>
                <p className="mt-1">{url}</p>
              </div>

              {extractedArticle && (
                <>
                  <div>
                    <Label className="text-muted-foreground">タイトル</Label>
                    <p className="mt-1">{extractedArticle.title}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">公開日</Label>
                    <p className="mt-1">{publishedDateLabel}</p>
                  </div>
                </>
              )}

              <div>
                <Label className="text-muted-foreground">タグ</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTags.map((tagId) => {
                    const tag = availableTags.find((t) => t.id === tagId);
                    return tag ? (
                      <span
                        key={tag.id}
                        className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                      >
                        {tag.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {comment && (
                <div>
                  <Label className="text-muted-foreground">コメント</Label>
                  <p className="mt-1 text-sm">{comment}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">本文</Label>
                {extractedArticle ? (
                  <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border p-4">
                    <MarkdownPreview content={extractedArticle.content} />
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    本文がありません
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("tags")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
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
      )}
    </div>
  );
}
