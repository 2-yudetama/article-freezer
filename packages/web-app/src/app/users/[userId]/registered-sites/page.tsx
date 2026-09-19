import RegisteredSitesPage from "@/features/registered-sites/page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{
    siteId?: string;
    cursor?: string;
    mode?: "initial" | "page";
  }>;
}) {
  const { userId } = await params;
  return <RegisteredSitesPage userId={userId} searchParams={searchParams} />;
}
