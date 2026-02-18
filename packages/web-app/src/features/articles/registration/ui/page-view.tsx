"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileEdit,
  Loader2,
  RefreshCw,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ArticleTag, RegistrationStep } from "@/lib/types";

type Heading = {
  id: string;
  level: number;
  text: string;
  selected: boolean;
};

type ArticleRegistrationPageViewProps = {
  userId: string;
  step: RegistrationStep;
  url: string;
  headings: Heading[];
  selectedTags: string[];
  comment: string;
  summary: string;
  summaryRetryCount: number;
  isLoading: boolean;
  steps: RegistrationStep[];
  currentStepIndex: number;
  progress: number;
  availableTags: ArticleTag[];
  setUrl: (value: string) => void;
  setComment: (value: string) => void;
  setSummary: (value: string) => void;
  setStep: (value: RegistrationStep) => void;
  handleUrlSubmit: () => Promise<void>;
  handleHeadingsSubmit: () => void;
  handleTagsCommentSubmit: () => void;
  handleRegenerate: () => Promise<void>;
  handleSummarySubmit: () => void;
  handleSave: () => Promise<void>;
  toggleHeading: (id: string) => void;
  toggleTag: (tagId: string) => void;
};

/** 記事登録ページのUIを表示する関数 */
export default function ArticleRegistrationPageView({
  userId,
  step,
  url,
  headings,
  selectedTags,
  comment,
  summary,
  summaryRetryCount,
  isLoading,
  steps,
  currentStepIndex,
  progress,
  availableTags,
  setUrl,
  setComment,
  setSummary,
  setStep,
  handleUrlSubmit,
  handleHeadingsSubmit,
  handleTagsCommentSubmit,
  handleRegenerate,
  handleSummarySubmit,
  handleSave,
  toggleHeading,
  toggleTag,
}: ArticleRegistrationPageViewProps) {
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

      {step === "headings" && (
        <Card>
          <CardHeader>
            <CardTitle>見出しを選択</CardTitle>
            <CardDescription>
              要約に含めたい見出しを選択してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {headings.map((heading) => (
                <div
                  key={heading.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  style={{ paddingLeft: `${heading.level * 1}rem` }}
                >
                  <Checkbox
                    id={heading.id}
                    checked={heading.selected}
                    onCheckedChange={() => toggleHeading(heading.id)}
                  />
                  <Label htmlFor={heading.id} className="flex-1 cursor-pointer">
                    {heading.text}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    H{heading.level}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("url")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
              <Button onClick={handleHeadingsSubmit}>
                次へ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "tags-comment" && (
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

          <Card>
            <CardHeader>
              <CardTitle>コメント</CardTitle>
              <CardDescription>
                記事についての感想やメモを入力してください(任意、マークダウン対応)
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            <Button variant="outline" onClick={() => setStep("headings")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
            <Button onClick={handleTagsCommentSubmit}>
              次へ
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === "summary" && (
        <Card>
          <CardHeader>
            <CardTitle>要約</CardTitle>
            <CardDescription>
              AIが記事の要約を生成しました。必要に応じて編集できます(マークダウン対応)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  要約を生成しています...
                </p>
              </div>
            ) : (
              <>
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
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={8}
                      placeholder="記事の要約&#10;&#10;**太字**、*イタリック*、`コード`などのマークダウン記法が使えます"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-4">
                    {summary ? (
                      <MarkdownPreview content={summary} />
                    ) : (
                      <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                          プレビューする内容がありません
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    再生成回数: {summaryRetryCount} / 3
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={summaryRetryCount >= 3 || isLoading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    再生成
                  </Button>
                </div>
              </>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("tags-comment")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
              <Button onClick={handleSummarySubmit} disabled={isLoading}>
                次へ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
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

              <div>
                <Label className="text-muted-foreground">選択した見出し</Label>
                <ul className="mt-1 space-y-1">
                  {headings
                    .filter((heading) => heading.selected)
                    .map((heading) => (
                      <li key={heading.id} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {heading.text}
                      </li>
                    ))}
                </ul>
              </div>

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
                <Label className="text-muted-foreground">要約</Label>
                <p className="mt-1 text-sm">{summary}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("summary")}>
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
