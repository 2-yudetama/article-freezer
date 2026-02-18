import ArticleEditPage from "@/features/articles/article-edit-page";

export default function Page({
  params,
}: {
  params: Promise<{ article_id: string }>;
}) {
  return <ArticleEditPage params={params} />;
}
