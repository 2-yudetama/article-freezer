"use client";

import type { Article } from "@/domain/articles";
import { useArticleDetail } from "@/features/articles/detail/hooks/use-article-detail";
import ArticleComment from "@/features/articles/detail/ui/ArticleComment";
import ArticleContent from "@/features/articles/detail/ui/ArticleContent";
import ArticleHeader from "@/features/articles/detail/ui/ArticleHeader";
import ArticleMetadata from "@/features/articles/detail/ui/ArticleMetadata";

type ArticleDetailPageClientProps = {
  userId: string;
  article: Article;
};

/** 記事詳細ページの状態管理と表示をつなぐ関数 */
export default function ArticleDetailPageClient({
  userId,
  article,
}: ArticleDetailPageClientProps) {
  const articleDetailPage = useArticleDetail({
    userId,
    article,
  });

  return (
    <div className="container mx-auto flex flex-col max-w-full h-[calc(100dvh-8rem)] md:h-screen space-y-4">
      <div className="mx-auto w-full max-w-6xl px-4">
        <ArticleHeader
          userId={articleDetailPage.userId}
          article={articleDetailPage.article}
          deleteDialogOpen={articleDetailPage.deleteDialogOpen}
          onDeleteDialogOpenChange={articleDetailPage.setDeleteDialogOpen}
          onDelete={articleDetailPage.handleDelete}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-readable">
        <div className="mx-auto w-full max-w-6xl px-8 pb-8 space-y-8">
          <ArticleMetadata
            userId={articleDetailPage.userId}
            article={articleDetailPage.article}
          />
          <ArticleContent content={articleDetailPage.article.content} />
          <ArticleComment comment={articleDetailPage.article.comment} />
        </div>
      </div>
    </div>
  );
}
