import { getLogger } from "@logtape/logtape";
import { notFound } from "next/navigation";
import { getArticle } from "@/features/articles/detail/api/detail.actions";
import ArticleDetailPageClient from "@/features/articles/detail/page-client";
import ArticleHeader from "@/features/articles/detail/ui/ArticleHeader";
import { DataIntegrityError, NotFoundError } from "@/lib/errors";

const logger = getLogger(["web-app", "articles", "detail"]);

/** 記事詳細ページを表示する関数 */
export default async function ArticleDetailPage({
  userId,
  articleId,
}: {
  userId: string;
  articleId: string;
}) {
  try {
    // サーバ側で記事を取得
    const articleDetailPageData = await getArticle({
      userId,
      articleId,
    });

    return (
      <ArticleDetailPageClient
        userId={userId}
        article={articleDetailPageData}
      />
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    const errorMessage =
      error instanceof DataIntegrityError
        ? "記事詳細の取得に失敗しました"
        : "内部サーバエラーが発生しました";

    logger.error("Failed to load article detail page", {
      userId,
      articleId,
      errorName: error instanceof Error ? error.name : "Error",
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return (
      <div className="container mx-auto max-w-6xl px-4">
        <ArticleHeader userId={userId} />
        <div className="mt-6 rounded-lg border border-destructive/40 p-6">
          <h1 className="font-bold text-2xl">記事を表示できません</h1>
          <p className="mt-2 text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }
}
