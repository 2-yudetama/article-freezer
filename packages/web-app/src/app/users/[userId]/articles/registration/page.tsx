import ArticleRegistrationPage from "@/features/articles/registration/page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const params = await searchParams;
  return <ArticleRegistrationPage initialUrl={params.url ?? ""} />;
}
