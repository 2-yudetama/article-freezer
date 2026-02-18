import ArticleEditPage from "@/features/articles/edit/page";

export default function Page({
  params,
}: {
  params: Promise<{ article_id: string }>;
}) {
  return <ArticleEditPage params={params} />;
}
