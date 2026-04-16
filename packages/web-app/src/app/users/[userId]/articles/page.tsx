import {
  type ArticleListPageSearchParams,
  parseArticleListSearchParams,
} from "@/features/articles/list/common";
import ArticlesPage from "@/features/articles/list/page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<ArticleListPageSearchParams>;
}) {
  const { userId } = await params;

  return (
    <ArticlesPage
      userId={userId}
      searchParams={parseArticleListSearchParams(await searchParams)}
    />
  );
}
