"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/tw-merge";

interface MarkdownPreviewProps {
  content: string;
  cardClassName?: string;
  contentClassName?: string;
}

export function MarkdownPreview({
  content,
  cardClassName,
  contentClassName,
}: MarkdownPreviewProps) {
  return (
    <Card className={cn("py-0", cardClassName)}>
      <CardContent
        className={cn(
          "px-6 py-4 prose prose-slate dark:prose-invert max-w-none scrollbar-readable",
          contentClassName,
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="text-3xl font-bold mt-7 mb-5" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-2xl font-bold mt-6 mb-4 border-b border-border pb-2"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-xl font-bold mt-5 mb-3" {...props} />
            ),
            h4: ({ node, ...props }) => (
              <h4 className="text-lg font-bold mt-4 mb-2" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong className="font-bold" {...props} />
            ),
            em: ({ node, ...props }) => <em className="italic" {...props} />,
            a: ({ node, ...props }) => (
              <a
                className="break-all text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            pre: ({ node, ...props }) => (
              <pre
                className="bg-muted p-4 rounded-lg overflow-x-auto my-4"
                {...props}
              />
            ),
            code: ({ node, className, ...props }) => {
              const isBlock =
                typeof className === "string" &&
                className.includes("language-");
              const codeClassName = [
                isBlock
                  ? "text-sm font-mono"
                  : "bg-muted px-1.5 py-0.5 rounded text-sm font-mono",
                className,
              ]
                .filter(Boolean)
                .join(" ");
              return <code className={codeClassName} {...props} />;
            },
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-4" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-4" {...props} />
            ),
            li: ({ node, ...props }) => <li className="ml-4" {...props} />,
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="my-4 border-l-4 border-muted-foreground/40 pl-4 text-muted-foreground [&>p]:my-0"
                {...props}
              />
            ),
            table: ({ node, ...props }) => (
              <div className="my-4 overflow-x-auto scrollbar-readable">
                <table className="w-full border-collapse text-sm" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-muted" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th
                className="border border-border px-3 py-2 text-left font-semibold"
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td
                className="border border-border px-3 py-2 align-top"
                {...props}
              />
            ),
            p: ({ node, ...props }) => (
              <p
                className="mt-2 mb-4 whitespace-pre-wrap leading-relaxed"
                {...props}
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
}
