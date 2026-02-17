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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
import { mockTags } from "@/lib/mock-data";
import type { RegistrationStep } from "@/lib/types";

type Heading = {
  id: string;
  level: number;
  text: string;
  selected: boolean;
};

export default function ArticleRegistrationPage() {
  const router = useRouter();

  const [step, setStep] = useState<RegistrationStep>("url");
  const [url, setUrl] = useState("");
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryRetryCount, setSummaryRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const steps: RegistrationStep[] = [
    "url",
    "headings",
    "tags-comment",
    "summary",
    "confirm",
  ];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleUrlSubmit = async () => {
    if (!url) {
      toast.error("エラー", {
        description: "URLを入力してください",
      });
      return;
    }

    setIsLoading(true);
    // モック: 見出しを取得
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setHeadings([
      { id: "1", level: 1, text: "はじめに", selected: true },
      { id: "2", level: 2, text: "背景と課題", selected: false },
      { id: "3", level: 2, text: "解決策の提案", selected: true },
      { id: "4", level: 3, text: "技術選定", selected: false },
      { id: "5", level: 3, text: "実装方法", selected: true },
      { id: "6", level: 2, text: "まとめ", selected: true },
    ]);
    setIsLoading(false);
    setStep("headings");
  };

  const handleHeadingsSubmit = () => {
    const hasSelected = headings.some((h) => h.selected);
    if (!hasSelected) {
      toast.info("確認", {
        description: "見出しが選択されていませんが、このまま進みますか?",
      });
    }
    setStep("tags-comment");
  };

  const handleTagsCommentSubmit = () => {
    if (selectedTags.length === 0) {
      toast.info("確認", {
        description: "タグが選択されていませんが、このまま進みますか?",
      });
    }
    setStep("summary");
    generateSummary();
  };

  const generateSummary = async () => {
    setIsLoading(true);
    // モック: 要約を生成
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSummary(
      "この記事では、最新のWebフレームワークを使用した開発手法について詳しく解説しています。特に、サーバーサイドレンダリングとクライアントサイドレンダリングの適切な使い分けや、パフォーマンス最適化のテクニックに焦点を当てています。実践的なコード例とともに、プロダクション環境での運用ノウハウも紹介されています。",
    );
    setIsLoading(false);
  };

  const handleRegenerate = async () => {
    if (summaryRetryCount >= 3) {
      toast.error("エラー", {
        description: "要約の再生成は3回までです",
      });
      return;
    }
    setSummaryRetryCount((prev) => prev + 1);
    await generateSummary();
  };

  const handleSummarySubmit = () => {
    setStep("confirm");
  };

  const handleSave = async () => {
    setIsLoading(true);
    // モック: 保存処理
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    toast.success("登録完了", {
      description: "記事が正常に登録されました",
    });
    router.push("/articles");
  };

  const toggleHeading = (id: string) => {
    setHeadings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, selected: !h.selected } : h)),
    );
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
      <div className="mb-8">
        <Link href="/articles">
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

      {/* ステップ1: URL入力 */}
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

      {/* ステップ2: 見出し選択 */}
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

      {/* ステップ3: タグ・コメント */}
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

      {/* ステップ4: 要約生成 */}
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

      {/* ステップ5: 確認 */}
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
                    .filter((h) => h.selected)
                    .map((h) => (
                      <li key={h.id} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {h.text}
                      </li>
                    ))}
                </ul>
              </div>

              <div>
                <Label className="text-muted-foreground">タグ</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTags.map((tagId) => {
                    const tag = mockTags.find((t) => t.id === tagId);
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
