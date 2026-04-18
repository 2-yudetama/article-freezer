import ArticleDetailPage from "@/features/articles/detail/page";

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string; article_id: string }>;
}) {
  const { userId, article_id } = await params;

  return <ArticleDetailPage userId={userId} articleId={article_id} />;
}
