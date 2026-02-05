"use client";

import { Card, CardContent } from "@/components/ui/card";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  // 簡易的なマークダウンレンダリング
  const renderMarkdown = (text: string) => {
    if (!text) return "";

    let html = text;

    // 見出し
    html = html.replace(
      /^### (.*$)/gim,
      '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>',
    );
    html = html.replace(
      /^## (.*$)/gim,
      '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>',
    );
    html = html.replace(
      /^# (.*$)/gim,
      '<h1 class="text-3xl font-bold mt-10 mb-5">$1</h1>',
    );

    // 太字
    html = html.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold">$1</strong>',
    );
    html = html.replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>');

    // イタリック
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

    // インラインコード
    html = html.replace(
      /`(.*?)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>',
    );

    // リンク
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>',
    );

    // コードブロック
    html = html.replace(
      /```([a-z]*)\n([\s\S]*?)```/g,
      '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono">$2</code></pre>',
    );

    // リスト
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>');

    // 段落
    html = html
      .split("\n\n")
      .map((para) => {
        if (para.match(/^<[h|l|p|d]/)) {
          return para;
        }
        return `<p class="mb-4 leading-relaxed">${para.replace(/\n/g, "<br />")}</p>`;
      })
      .join("\n");

    return html;
  };

  return (
    <Card>
      <CardContent className="p-6 prose prose-slate dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      </CardContent>
    </Card>
  );
}
