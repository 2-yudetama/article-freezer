import { notFound } from "next/navigation";
import type React from "react";
import * as v from "valibot";

/** 記事IDの形式チェックを行う */
export default async function ArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ article_id: string }>;
}) {
  const { article_id } = await params;

  const result = v.safeParse(v.pipe(v.string(), v.uuid()), article_id);
  if (!result.success) {
    return notFound();
  }

  return children;
}
