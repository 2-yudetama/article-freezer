import { getLogger } from "@logtape/logtape";
import { FeedCursorStaleError } from "./common/errors";
import RegisteredSitesPageClient from "./page-client";
import { getRegisteredSitePageData } from "./server/registered-sites.service";

const logger = getLogger(["web-app", "registered-sites"]);

export default async function RegisteredSitesPage({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: Promise<{
    siteId?: string;
    cursor?: string;
    since?: string;
    accessStartedAt?: string;
    mode?: "initial" | "page";
  }>;
}) {
  const params = await searchParams;
  try {
    const data = await getRegisteredSitePageData({
      userId,
      registeredSiteId: params.siteId,
      cursor: params.cursor,
      since: params.since,
      accessStartedAt: params.accessStartedAt,
      operation: params.mode === "page" || params.cursor ? "page" : "initial",
    });
    return <RegisteredSitesPageClient userId={userId} {...data} />;
  } catch (error) {
    logger.error("Failed to load registered sites page", {
      userId,
      errorName: error instanceof Error ? error.name : "Error",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof FeedCursorStaleError) {
      return (
        <RegisteredSitesPageClient
          userId={userId}
          sites={[]}
          selectedSiteId={null}
          entries={[]}
          nextCursor={null}
          cacheVersion={null}
          accessBaseline={params.since ?? new Date().toISOString()}
          accessStartedAt={params.accessStartedAt ?? new Date().toISOString()}
          displaySucceeded={false}
          accessRecorded={false}
          cursorStale
        />
      );
    }
    return (
      <RegisteredSitesPageClient
        userId={userId}
        sites={[]}
        selectedSiteId={null}
        entries={[]}
        nextCursor={null}
        cacheVersion={null}
        accessBaseline={new Date().toISOString()}
        accessStartedAt={new Date().toISOString()}
        displaySucceeded={false}
        accessRecorded={false}
        errorMessage="登録サイトの取得に失敗しました。再読み込みしてください"
      />
    );
  }
}
