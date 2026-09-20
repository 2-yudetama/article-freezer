import { getLogger } from "@logtape/logtape";
import { notFound } from "next/navigation";
import { getArticle } from "@/features/articles/detail/api/detail.actions";
import { DataIntegrityError, NotFoundError } from "@/lib/errors";
import ArticleEditPageClient from "./page-client";

const logger = getLogger(["web-app", "articles", "edit"]);

/** 記事編集ページを表示する関数 */
export default async function ArticleEditPage({
  params,
}: {
  params: Promise<{ userId: string; article_id: string }>;
}) {
  const { userId, article_id: articleId } = await params;

  try {
    const article = await getArticle({
      userId,
      articleId,
    });

    return <ArticleEditPageClient userId={userId} article={article} />;
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    const errorMessage =
      error instanceof DataIntegrityError
        ? "記事編集画面の取得に失敗しました"
        : "内部サーバエラーが発生しました";

    logger.error("Failed to load article edit page", {
      userId,
      articleId,
      errorName: error instanceof Error ? error.name : "Error",
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold">記事を編集できません</h1>
        <p className="mt-2 text-muted-foreground">{errorMessage}</p>
      </div>
    );
  }
}
