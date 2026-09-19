import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { Prisma, prisma } from "db";
import * as v from "valibot";
import { NotFoundError } from "@/lib/errors";
import {
  REGISTERED_SITE_CONFIG,
  REGISTERED_SITE_CURSOR_VERSION,
} from "../common/constants";
import {
  FeedCandidatesError,
  FeedCursorStaleError,
  FeedFetchError,
  FeedInputError,
  FeedParseError,
  FeedRateLimitError,
} from "../common/errors";
import {
  type FeedCandidate,
  type FeedEntryView,
  type RegisteredSiteCursor,
  RegisteredSiteCursorSchema,
  type RegisteredSitePageData,
  type RegisteredSiteStatus,
  type RegisteredSiteView,
} from "../common/types";
import { discoverFeeds } from "./discover-feeds";
import { fetchBoundedFeed } from "./fetch-feed";
import { type ParsedFeed, type ParsedFeedEntry, parseFeed } from "./parse-feed";
import { assertPublicUrl } from "./url-security";

type DbTransaction = Prisma.TransactionClient;
type PageOperation = "initial" | "page" | "refresh";

type FeedSiteRecord = Awaited<ReturnType<typeof getOwnedSite>>;

type SiteViewOptions = {
  status?: RegisteredSiteStatus;
  errorMessage?: string;
};

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function databaseNow(client: typeof prisma | DbTransaction = prisma) {
  const result = await client.$queryRaw<Array<{ now: Date }>>(
    Prisma.sql`SELECT clock_timestamp() AS "now"`,
  );
  return result[0]?.now ?? new Date();
}

async function getOwnedSite(userId: string, registeredSiteId: string) {
  return prisma.registeredSite.findFirst({
    where: { registered_site_id: registeredSiteId, user_id: userId },
  });
}

function toSiteView(
  site: NonNullable<FeedSiteRecord>,
  options: SiteViewOptions = {},
): RegisteredSiteView {
  const status = options.status ?? (site.feed_url ? "ready" : "link");
  return {
    registeredSiteId: site.registered_site_id,
    siteUrl: site.site_url,
    displayName: site.display_name,
    feedUrl: site.feed_url,
    status,
    lastSuccessAt: site.last_success_at?.toISOString() ?? null,
    fetchNotBefore: site.fetch_not_before?.toISOString() ?? null,
    ...(options.errorMessage ? { errorMessage: options.errorMessage } : {}),
  };
}

function feedCandidateToView(candidate: FeedCandidate) {
  return {
    feedUrl: candidate.feedUrl,
    title: candidate.title,
    format: candidate.format,
  };
}

function encodeCursor(cursor: RegisteredSiteCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(value: string | undefined): RegisteredSiteCursor | null {
  if (!value) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );
    const result = v.safeParse(RegisteredSiteCursorSchema, decoded);
    if (!result.success) throw new FeedCursorStaleError();
    return result.output;
  } catch (error) {
    if (error instanceof FeedCursorStaleError) throw error;
    throw new FeedCursorStaleError();
  }
}

function toEntryView(
  entry: {
    feed_entry_id: string;
    entry_key: string;
    article_url: string;
    title: string;
    thumbnail_url: string | null;
    published_at: Date | null;
    first_seen_at: Date;
  },
  baseline: Date,
): FeedEntryView {
  return {
    feedEntryId: entry.feed_entry_id,
    entryKey: entry.entry_key,
    articleUrl: entry.article_url,
    title: entry.title,
    thumbnailUrl: entry.thumbnail_url,
    publishedAt: entry.published_at?.toISOString() ?? null,
    isNew: entry.first_seen_at > baseline,
  };
}

function entriesEqual(
  existing: Array<{
    entry_key: string;
    source_entry_id: string | null;
    article_url: string;
    title: string;
    thumbnail_url: string | null;
    published_at: Date | null;
  }>,
  incoming: ParsedFeedEntry[],
) {
  if (existing.length !== incoming.length) return false;
  const existingByKey = new Map(
    existing.map((entry) => [entry.entry_key, entry]),
  );
  return incoming.every((entry) => {
    const current = existingByKey.get(entry.entryKey);
    return (
      current?.source_entry_id === entry.sourceEntryId &&
      current.article_url === entry.articleUrl &&
      current.title === entry.title &&
      current.thumbnail_url === entry.thumbnailUrl &&
      current.published_at?.getTime() === entry.publishedAt?.getTime()
    );
  });
}

function ensureEntryLimit(feed: ParsedFeed) {
  if (feed.entries.length > REGISTERED_SITE_CONFIG.maxEntries) {
    throw new FeedFetchError(
      `フィードの記事数が上限 (${REGISTERED_SITE_CONFIG.maxEntries} 件) を超えています`,
      "too-large",
    );
  }
}

async function saveFeedResult({
  registeredSiteId,
  userId,
  fetchToken,
  feed,
}: {
  registeredSiteId: string;
  userId: string;
  fetchToken: string;
  feed: ParsedFeed;
}) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT "registered_site_id" FROM "registered_sites" WHERE "registered_site_id" = CAST(${registeredSiteId} AS uuid) AND "user_id" = CAST(${userId} AS uuid) FOR UPDATE`,
      );

      const site = await tx.registeredSite.findFirst({
        where: { registered_site_id: registeredSiteId, user_id: userId },
      });
      if (!site || site.fetch_token !== fetchToken) {
        return null;
      }

      // 取得開始時刻ではなく、ロックを取得して反映する DB 時刻を新着基準に使う
      const reflectedAt = await databaseNow(tx);

      const existing = await tx.feedEntry.findMany({
        where: { registered_site_id: registeredSiteId },
      });
      const changed = !entriesEqual(existing, feed.entries);
      const firstSeenByKey = new Map(
        existing.map((entry) => [entry.entry_key, entry.first_seen_at]),
      );

      await tx.feedEntry.deleteMany({
        where: { registered_site_id: registeredSiteId },
      });
      if (feed.entries.length > 0) {
        await tx.feedEntry.createMany({
          data: feed.entries.map((entry) => ({
            registered_site_id: registeredSiteId,
            entry_key: entry.entryKey,
            source_entry_id: entry.sourceEntryId,
            article_url: entry.articleUrl,
            title: entry.title,
            thumbnail_url: entry.thumbnailUrl,
            published_at: entry.publishedAt,
            first_seen_at: firstSeenByKey.get(entry.entryKey) ?? reflectedAt,
          })),
        });
      }

      const cacheVersion =
        site.last_success_at === null || changed
          ? site.cache_version + BigInt(1)
          : site.cache_version;
      return tx.registeredSite.update({
        where: { registered_site_id: registeredSiteId },
        data: {
          last_success_at: reflectedAt,
          cache_version: cacheVersion,
          fetch_token: null,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

async function clearFetchToken(
  registeredSiteId: string,
  userId: string,
  fetchToken: string,
) {
  await prisma.registeredSite.updateMany({
    where: {
      registered_site_id: registeredSiteId,
      user_id: userId,
      fetch_token: fetchToken,
    },
    data: { fetch_token: null },
  });
}

async function claimFetch(site: NonNullable<FeedSiteRecord>, now: Date) {
  const fetchToken = randomUUID();
  const fetchNotBefore = new Date(
    now.getTime() + REGISTERED_SITE_CONFIG.fetchIntervalMs,
  );
  const result = await prisma.registeredSite.updateMany({
    where: {
      registered_site_id: site.registered_site_id,
      user_id: site.user_id,
      OR: [{ fetch_not_before: null }, { fetch_not_before: { lte: now } }],
    },
    data: { fetch_token: fetchToken, fetch_not_before: fetchNotBefore },
  });
  return result.count === 1 ? { fetchToken, fetchNotBefore } : null;
}

async function fetchAndStore(site: NonNullable<FeedSiteRecord>, now: Date) {
  if (!site.feed_url) return site;

  const deadlineAt = Date.now() + REGISTERED_SITE_CONFIG.operationTimeoutMs;
  const claim = await claimFetch(site, now);
  if (!claim) {
    throw new FeedRateLimitError(
      site.fetch_not_before ??
        new Date(now.getTime() + REGISTERED_SITE_CONFIG.fetchIntervalMs),
    );
  }

  try {
    const response = await fetchBoundedFeed(site.feed_url, { deadlineAt });
    const feed = parseFeed(response.body, { deadlineAt });
    ensureEntryLimit(feed);
    return await saveFeedResult({
      registeredSiteId: site.registered_site_id,
      userId: site.user_id,
      fetchToken: claim.fetchToken,
      feed,
    });
  } catch (error) {
    await clearFetchToken(
      site.registered_site_id,
      site.user_id,
      claim.fetchToken,
    );
    throw error;
  }
}

async function getEntriesPage({
  userId,
  registeredSiteId,
  baseline,
  cursor,
}: {
  userId: string;
  registeredSiteId: string;
  baseline: Date;
  cursor?: string;
}) {
  const decodedCursor = decodeCursor(cursor);
  return prisma.$transaction(
    async (tx) => {
      const site = await tx.registeredSite.findFirst({
        where: { registered_site_id: registeredSiteId, user_id: userId },
      });
      if (!site) return null;

      if (
        decodedCursor &&
        (decodedCursor.registeredSiteId !== registeredSiteId ||
          decodedCursor.cacheVersion !== site.cache_version.toString())
      ) {
        throw new FeedCursorStaleError();
      }

      const where: Prisma.FeedEntryWhereInput = {
        registered_site_id: registeredSiteId,
      };
      if (decodedCursor) {
        if (decodedCursor.publishedAt === null) {
          // 公開日時不明の記事は既知日時の記事の後ろにまとめる
          where.published_at = null;
          where.entry_key = { lt: decodedCursor.entryKey };
        } else {
          const publishedAt = new Date(decodedCursor.publishedAt);
          if (Number.isNaN(publishedAt.getTime()))
            throw new FeedCursorStaleError();
          where.OR = [
            { published_at: { lt: publishedAt } },
            {
              published_at: publishedAt,
              entry_key: { lt: decodedCursor.entryKey },
            },
          ];
        }
      }

      const entries = await tx.feedEntry.findMany({
        where,
        orderBy: [
          { published_at: { sort: "desc", nulls: "last" } },
          { entry_key: "desc" },
        ],
        take: REGISTERED_SITE_CONFIG.pageSize + 1,
      });
      const hasNext = entries.length > REGISTERED_SITE_CONFIG.pageSize;
      const pageEntries = hasNext
        ? entries.slice(0, REGISTERED_SITE_CONFIG.pageSize)
        : entries;
      const lastEntry = pageEntries.at(-1);
      return {
        cacheVersion: site.cache_version.toString(),
        entries: pageEntries.map((entry) => toEntryView(entry, baseline)),
        nextCursor:
          hasNext && lastEntry
            ? encodeCursor({
                version: REGISTERED_SITE_CURSOR_VERSION,
                registeredSiteId,
                cacheVersion: site.cache_version.toString(),
                publishedAt: lastEntry.published_at?.toISOString() ?? null,
                entryKey: lastEntry.entry_key,
              })
            : null,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

export async function discoverRegisteredSiteFeeds(input: string) {
  const result = await discoverFeeds(input);
  return {
    sourceUrl: result.sourceUrl,
    siteUrl: result.siteUrl,
    candidates: result.candidates.map(feedCandidateToView),
  };
}

export async function registerSite({
  userId,
  siteUrl: rawSiteUrl,
  feedUrl: rawFeedUrl,
}: {
  userId: string;
  siteUrl: string;
  feedUrl?: string | null;
}) {
  const deadlineAt = Date.now() + REGISTERED_SITE_CONFIG.operationTimeoutMs;
  const siteUrl = await assertPublicUrl(rawSiteUrl, { deadlineAt });
  let feedUrl: string | null = null;
  let displayName = new URL(siteUrl).hostname;
  let feed: ParsedFeed | null = null;

  if (rawFeedUrl !== undefined && rawFeedUrl !== null) {
    feedUrl = await assertPublicUrl(rawFeedUrl, { deadlineAt });
    const response = await fetchBoundedFeed(feedUrl, { deadlineAt });
    feed = parseFeed(response.body, { deadlineAt });
    feedUrl = response.url;
    displayName = feed.title;
  } else if (rawFeedUrl === undefined) {
    const discovered = await discoverFeeds(siteUrl, { deadlineAt });
    if (discovered.candidates.length > 1) {
      throw new FeedCandidatesError(discovered.candidates);
    }
    if (discovered.candidates.length === 1) {
      feedUrl = discovered.candidates[0].feedUrl;
      displayName = discovered.candidates[0].title;
      const response = await fetchBoundedFeed(feedUrl, { deadlineAt });
      feed = parseFeed(response.body, { deadlineAt });
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const reflectedAt = feed ? await databaseNow(tx) : null;
    const site = await tx.registeredSite.create({
      data: {
        user_id: userId,
        site_url: siteUrl,
        site_url_key: hashKey(siteUrl),
        display_name: displayName,
        feed_url: feedUrl,
        feed_url_key: feedUrl ? hashKey(feedUrl) : null,
        ...(reflectedAt
          ? { last_success_at: reflectedAt, cache_version: BigInt(1) }
          : {}),
      },
    });
    if (feed && feed.entries.length > 0 && reflectedAt) {
      await tx.feedEntry.createMany({
        data: feed.entries.map((entry) => ({
          registered_site_id: site.registered_site_id,
          entry_key: entry.entryKey,
          source_entry_id: entry.sourceEntryId,
          article_url: entry.articleUrl,
          title: entry.title,
          thumbnail_url: entry.thumbnailUrl,
          published_at: entry.publishedAt,
          first_seen_at: reflectedAt,
        })),
      });
    }
    return site;
  });

  return {
    site: toSiteView(created),
    feed: feed
      ? {
          title: feed.title,
          format: feed.format,
          entryCount: feed.entries.length,
        }
      : null,
  };
}

export async function deleteRegisteredSite({
  userId,
  registeredSiteId,
}: {
  userId: string;
  registeredSiteId: string;
}) {
  const result = await prisma.registeredSite.deleteMany({
    where: { registered_site_id: registeredSiteId, user_id: userId },
  });
  return result.count === 1;
}

export async function recordRegisteredSiteAccess({
  userId,
  accessStartedAt,
  displayed,
}: {
  userId: string;
  accessStartedAt: string;
  displayed: boolean;
}) {
  if (!displayed) return false;

  const startedAt = new Date(accessStartedAt);
  if (Number.isNaN(startedAt.getTime())) {
    throw new FeedInputError("閲覧開始時刻が正しくありません");
  }

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "site_tab_states" ("user_id", "last_accessed_at")
      VALUES (CAST(${userId} AS uuid), ${startedAt})
      ON CONFLICT ("user_id") DO UPDATE
      SET "last_accessed_at" = GREATEST(
        "site_tab_states"."last_accessed_at",
        EXCLUDED."last_accessed_at"
      )
    `,
  );
  return true;
}

export async function getRegisteredSitePageData({
  userId,
  registeredSiteId,
  cursor,
  since,
  accessStartedAt,
  operation = "initial",
  forceRefresh = false,
}: {
  userId: string;
  registeredSiteId?: string;
  cursor?: string;
  since?: string;
  accessStartedAt?: string;
  operation?: PageOperation;
  forceRefresh?: boolean;
}): Promise<RegisteredSitePageData> {
  const now = await databaseNow();
  const previousState = await prisma.siteTabState.findUnique({
    where: { user_id: userId },
  });
  const requestedAccessStartedAt = accessStartedAt
    ? new Date(accessStartedAt)
    : now;
  const startedAt = Number.isNaN(requestedAccessStartedAt.getTime())
    ? now
    : requestedAccessStartedAt;
  const requestedBaseline = since
    ? new Date(since)
    : previousState?.last_accessed_at;
  const baseline =
    requestedBaseline && !Number.isNaN(requestedBaseline.getTime())
      ? requestedBaseline
      : startedAt;

  const siteRecords = await prisma.registeredSite.findMany({
    where: { user_id: userId },
    orderBy: [{ created_at: "asc" }, { registered_site_id: "asc" }],
  });
  let sites = siteRecords.map((site) => toSiteView(site));
  if (
    registeredSiteId &&
    !siteRecords.some((site) => site.registered_site_id === registeredSiteId)
  ) {
    throw new NotFoundError();
  }

  let selected =
    siteRecords.find((site) => site.registered_site_id === registeredSiteId) ??
    siteRecords[0] ??
    null;
  let selectedView: RegisteredSiteView | null = selected
    ? toSiteView(selected)
    : null;
  // 先にキャッシュを読み取り、既存一覧がある場合はそれを表示しながら
  // 期限切れの更新を開始する。カーソル移動では外部取得を行わない
  let page: Awaited<ReturnType<typeof getEntriesPage>> = selected?.feed_url
    ? await getEntriesPage({
        userId,
        registeredSiteId: selected.registered_site_id,
        baseline,
        cursor,
      })
    : null;
  if (selected?.feed_url && page === null) throw new NotFoundError();

  if (selected?.feed_url && operation !== "page") {
    const isExpired =
      selected.last_success_at === null ||
      now.getTime() - selected.last_success_at.getTime() >=
        REGISTERED_SITE_CONFIG.cacheTtlMs;
    const shouldRefresh = forceRefresh || isExpired;
    if (shouldRefresh) {
      if (!forceRefresh) {
        // 初回表示ではキャッシュを先に返し、クライアントが refresh API を
        // 明示的に待つことで取得失敗を画面へ返せるようにする
        selectedView = toSiteView(selected, { status: "loading" });
      } else {
        try {
          const refreshed = await fetchAndStore(selected, now);
          if (!refreshed) {
            const latest = await getOwnedSite(
              userId,
              selected.registered_site_id,
            );
            if (!latest) throw new NotFoundError();
            selected = latest;
          } else {
            selected = refreshed;
          }
          selectedView = toSiteView(selected);
          page = await getEntriesPage({
            userId,
            registeredSiteId: selected.registered_site_id,
            baseline,
            cursor,
          });
          if (page === null) throw new NotFoundError();
        } catch (error) {
          if (
            error instanceof FeedCursorStaleError ||
            error instanceof NotFoundError
          ) {
            throw error;
          }
          const latest =
            (await getOwnedSite(userId, selected.registered_site_id)) ??
            selected;
          selected = latest;
          if (error instanceof FeedRateLimitError) {
            selectedView = toSiteView(selected, { status: "rate-limited" });
          } else {
            selectedView = toSiteView(selected, {
              status: "error",
              errorMessage:
                error instanceof FeedParseError
                  ? "フィードを解析できませんでした。再試行してください"
                  : "フィードの取得に失敗しました。再試行してください",
            });
          }
        }
      }
    }
  }

  if (selectedView) {
    sites = siteRecords.map((site) =>
      site.registered_site_id === selectedView?.registeredSiteId
        ? selectedView
        : toSiteView(site),
    );
  }

  const displaySucceeded =
    sites.length === 0 ||
    Boolean(
      selectedView &&
        (selectedView.feedUrl === null || selectedView.lastSuccessAt !== null),
    );

  return {
    sites,
    selectedSiteId: selected?.registered_site_id ?? null,
    entries: page?.entries ?? [],
    nextCursor: page?.nextCursor ?? null,
    cacheVersion: page?.cacheVersion ?? null,
    accessBaseline: baseline.toISOString(),
    accessStartedAt: startedAt.toISOString(),
    displaySucceeded,
    accessRecorded: false,
    ...(selectedView?.errorMessage
      ? { errorMessage: selectedView.errorMessage }
      : {}),
  };
}

export async function refreshRegisteredSite({
  userId,
  registeredSiteId,
  cursor,
  since,
  accessStartedAt,
}: {
  userId: string;
  registeredSiteId: string;
  cursor?: string;
  since?: string;
  accessStartedAt?: string;
}) {
  return getRegisteredSitePageData({
    userId,
    registeredSiteId,
    cursor,
    since,
    accessStartedAt,
    operation: "refresh",
    forceRefresh: true,
  });
}
