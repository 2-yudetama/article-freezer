"use client";

import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <Card>
      <CardContent className="p-6 prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="text-3xl font-bold mt-10 mb-5" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-2xl font-bold mt-8 mb-4" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-xl font-bold mt-6 mb-3" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong className="font-bold" {...props} />
            ),
            em: ({ node, ...props }) => <em className="italic" {...props} />,
            a: ({ node, ...props }) => (
              <a
                className="text-primary underline hover:no-underline"
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
              <ul className="list-disc pl-5" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-5" {...props} />
            ),
            li: ({ node, ...props }) => <li className="ml-4" {...props} />,
            p: ({ node, ...props }) => (
              <p className="mb-4 leading-relaxed" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
}
