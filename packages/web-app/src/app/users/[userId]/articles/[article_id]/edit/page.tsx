import ArticleEditPage from "@/features/articles/edit/page";

export default function Page({
  params,
}: {
  params: Promise<{ userId: string; article_id: string }>;
}) {
  return <ArticleEditPage params={params} />;
}
