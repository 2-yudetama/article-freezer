import type { PrismaClient } from "db";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  FeedCursorStaleError,
  FeedFetchError,
} from "@/features/registered-sites/common/errors";
import type * as RegisteredSiteService from "@/features/registered-sites/server/registered-sites.service";

const fetchFeedMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/registered-sites/server/fetch-feed", () => ({
  fetchBoundedFeed: fetchFeedMock,
}));
vi.mock("server-only", () => ({}));

const enabled = process.env.RUN_REGISTERED_SITE_DB_TESTS === "1";
const suite = enabled ? describe : describe.skip;

type Service = typeof RegisteredSiteService;

let service: Service;
let prisma: PrismaClient;
const userIds: string[] = [];

function rss(
  entries: Array<{
    id: string;
    url: string;
    title?: string;
  }>,
) {
  return `<rss version="2.0"><channel><title>Integration feed</title>${entries
    .map(
      (entry) =>
        `<item><guid>${entry.id}</guid><title>${entry.title ?? entry.id}</title><link>${entry.url}</link></item>`,
    )
    .join("")}</channel></rss>`;
}

function mockFeed(xml: string) {
  fetchFeedMock.mockResolvedValue({
    url: "https://feed.example.test/feed",
    body: xml,
    contentType: "application/rss+xml",
  });
}

async function createUser(label: string) {
  const user = await prisma.user.create({
    data: {
      provider: "integration",
      provider_account_id: `${label}-${crypto.randomUUID()}`,
      name: label,
      email: `${label}-${crypto.randomUUID()}@example.test`,
      image: "",
      role: 1,
      updated_at: new Date(),
    },
  });
  userIds.push(user.user_id);
  return user;
}

async function createSite(
  userId: string,
  options: {
    lastSuccessAt?: Date | null;
    cacheVersion?: bigint;
    fetchNotBefore?: Date | null;
    feedUrl?: string | null;
  } = {},
) {
  return prisma.registeredSite.create({
    data: {
      user_id: userId,
      site_url: `https://site.example.test/${crypto.randomUUID()}`,
      site_url_key: crypto.randomUUID().replaceAll("-", ""),
      display_name: "Integration site",
      feed_url:
        options.feedUrl === undefined
          ? "https://feed.example.test/feed"
          : options.feedUrl,
      feed_url_key:
        options.feedUrl === null
          ? null
          : crypto.randomUUID().replaceAll("-", ""),
      last_success_at: options.lastSuccessAt ?? null,
      cache_version: options.cacheVersion ?? BigInt(0),
      fetch_not_before: options.fetchNotBefore ?? null,
    },
  });
}

async function createEntries(
  registeredSiteId: string,
  entries: Array<{
    key: string;
    url: string;
    firstSeenAt: Date;
    publishedAt?: Date | null;
  }>,
) {
  await prisma.feedEntry.createMany({
    data: entries.map((entry) => ({
      registered_site_id: registeredSiteId,
      entry_key: entry.key,
      source_entry_id: entry.key,
      article_url: entry.url,
      title: entry.key,
      thumbnail_url: null,
      published_at: entry.publishedAt ?? null,
      first_seen_at: entry.firstSeenAt,
    })),
  });
}

suite("registered site service with PostgreSQL", () => {
  beforeAll(async () => {
    service = await import(
      "@/features/registered-sites/server/registered-sites.service"
    );
    ({ prisma } = await import("db"));
  });

  afterEach(async () => {
    fetchFeedMock.mockReset();
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { user_id: { in: userIds } } });
      userIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("ユーザ分離と所有者認可を維持する", async () => {
    const owner = await createUser("owner");
    const other = await createUser("other");
    const site = await createSite(owner.user_id, {
      lastSuccessAt: new Date(),
      cacheVersion: BigInt(1),
    });
    await createEntries(site.registered_site_id, [
      {
        key: "owner-entry",
        url: "https://article.example.test/owner",
        firstSeenAt: new Date(),
      },
    ]);

    const ownPage = await service.getRegisteredSitePageData({
      userId: owner.user_id,
      registeredSiteId: site.registered_site_id,
      operation: "page",
    });
    expect(ownPage.entries).toHaveLength(1);
    await expect(
      service.getRegisteredSitePageData({
        userId: other.user_id,
        registeredSiteId: site.registered_site_id,
        operation: "page",
      }),
    ).rejects.toMatchObject({ name: "NotFoundError" });
  });

  it("登録先の表示順をユーザ単位で保存し、他ユーザの ID は更新しない", async () => {
    const owner = await createUser("order-owner");
    const other = await createUser("order-other");
    const first = await createSite(owner.user_id, { feedUrl: null });
    const second = await createSite(owner.user_id, { feedUrl: null });
    const otherSite = await createSite(other.user_id, { feedUrl: null });

    await expect(
      service.reorderRegisteredSites({
        userId: owner.user_id,
        registeredSiteIds: [
          second.registered_site_id,
          first.registered_site_id,
        ],
      }),
    ).resolves.toEqual([
      { registered_site_id: second.registered_site_id },
      { registered_site_id: first.registered_site_id },
    ]);

    const page = await service.getRegisteredSitePageData({
      userId: owner.user_id,
      operation: "page",
    });
    expect(page.sites.map((site) => site.registeredSiteId)).toEqual([
      second.registered_site_id,
      first.registered_site_id,
    ]);

    await expect(
      service.reorderRegisteredSites({
        userId: owner.user_id,
        registeredSiteIds: [
          first.registered_site_id,
          otherSite.registered_site_id,
        ],
      }),
    ).rejects.toMatchObject({ name: "NotFoundError" });

    const otherRow = await prisma.registeredSite.findUniqueOrThrow({
      where: { registered_site_id: otherSite.registered_site_id },
      select: { sort_order: true },
    });
    expect(otherRow.sort_order).toBe(0);
  });

  it("同じ登録先への同時取得は一つだけが原子的 claim を取得する", async () => {
    const user = await createUser("claim");
    const site = await createSite(user.user_id);
    let release: (() => void) | undefined;
    fetchFeedMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              url: "https://feed.example.test/feed",
              body: rss([
                {
                  id: "claim-entry",
                  url: "https://article.example.test/claim",
                },
              ]),
              contentType: "application/rss+xml",
            });
        }),
    );

    const first = service.refreshRegisteredSite({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
    });
    await vi.waitFor(() => expect(fetchFeedMock).toHaveBeenCalledTimes(1));
    const second = service.refreshRegisteredSite({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
    });
    const secondPage = await second;
    expect(secondPage.sites[0]?.status).toBe("rate-limited");
    release?.();
    const firstPage = await first;
    expect(firstPage.sites[0]?.status).toBe("ready");
    expect(fetchFeedMock).toHaveBeenCalledTimes(1);
  });

  it("取得失敗ではキャッシュと世代を維持して最新の制限時刻を返す", async () => {
    const user = await createUser("failure");
    const lastSuccessAt = new Date("2026-01-01T00:00:00.000Z");
    const site = await createSite(user.user_id, {
      lastSuccessAt,
      cacheVersion: BigInt(4),
    });
    await createEntries(site.registered_site_id, [
      {
        key: "kept-entry",
        url: "https://article.example.test/kept",
        firstSeenAt: lastSuccessAt,
      },
    ]);
    fetchFeedMock.mockRejectedValue(new FeedFetchError("network", "network"));

    const result = await service.refreshRegisteredSite({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
    });
    const stored = await prisma.registeredSite.findUniqueOrThrow({
      where: { registered_site_id: site.registered_site_id },
    });
    expect(result.sites[0]?.status).toBe("error");
    expect(result.entries.map((entry) => entry.entryKey)).toEqual([
      "kept-entry",
    ]);
    expect(stored.cache_version).toBe(BigInt(4));
    expect(stored.last_success_at).toEqual(lastSuccessAt);
    expect(stored.fetch_token).toBeNull();
    expect(stored.fetch_not_before).not.toBeNull();
  });

  it("継続記事を維持し、除外記事を消し、再登場記事を新着として扱う", async () => {
    const user = await createUser("entries");
    const site = await createSite(user.user_id);
    mockFeed(
      rss([
        { id: "a", url: "https://article.example.test/a" },
        { id: "b", url: "https://article.example.test/b" },
      ]),
    );
    const first = await service.refreshRegisteredSite({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
    });
    const firstSeenB = await prisma.feedEntry.findFirstOrThrow({
      where: {
        registered_site_id: site.registered_site_id,
        source_entry_id: "b",
      },
    });
    await prisma.registeredSite.update({
      where: { registered_site_id: site.registered_site_id },
      data: { fetch_not_before: null },
    });
    mockFeed(
      rss([
        { id: "b", url: "https://article.example.test/b" },
        { id: "c", url: "https://article.example.test/c" },
      ]),
    );
    await service.refreshRegisteredSite({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
    });
    const afterRemoval = await prisma.feedEntry.findMany({
      where: { registered_site_id: site.registered_site_id },
    });
    expect(afterRemoval.map((entry) => entry.source_entry_id).sort()).toEqual([
      "b",
      "c",
    ]);
    expect(
      afterRemoval.find((entry) => entry.source_entry_id === "b")
        ?.first_seen_at,
    ).toEqual(firstSeenB.first_seen_at);

    await prisma.registeredSite.update({
      where: { registered_site_id: site.registered_site_id },
      data: { fetch_not_before: null },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    mockFeed(
      rss([
        { id: "a", url: "https://article.example.test/a" },
        { id: "b", url: "https://article.example.test/b" },
      ]),
    );
    await service.refreshRegisteredSite({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
    });
    const reappeared = await prisma.feedEntry.findFirstOrThrow({
      where: {
        registered_site_id: site.registered_site_id,
        source_entry_id: "a",
      },
    });
    expect(reappeared.first_seen_at.getTime()).toBeGreaterThan(
      firstSeenB.first_seen_at.getTime(),
    );
    expect(first.entries.every((entry) => entry.isNew)).toBe(true);
  });

  it("初回失敗後の再試行成功と空成功を記録できる", async () => {
    const user = await createUser("retry");
    const site = await createSite(user.user_id);
    fetchFeedMock.mockRejectedValueOnce(
      new FeedFetchError("network", "network"),
    );
    const loading = await service.getRegisteredSitePageData({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
    });
    expect(loading.sites[0]?.status).toBe("loading");
    const failed = await service.refreshRegisteredSite({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
    });
    expect(failed.sites[0]?.status).toBe("error");
    expect(failed.displaySucceeded).toBe(false);
    expect(
      await prisma.siteTabState.findUnique({
        where: { user_id: user.user_id },
      }),
    ).toBeNull();

    await prisma.registeredSite.update({
      where: { registered_site_id: site.registered_site_id },
      data: { fetch_not_before: null },
    });
    mockFeed("<rss><channel><title>Empty</title></channel></rss>");
    const succeeded = await service.refreshRegisteredSite({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
      since: failed.accessBaseline,
      accessStartedAt: failed.accessStartedAt,
    });
    expect(succeeded.sites[0]?.status).toBe("ready");
    expect(succeeded.entries).toHaveLength(0);
    expect(succeeded.displaySucceeded).toBe(true);
    await service.recordRegisteredSiteAccess({
      userId: user.user_id,
      accessStartedAt: failed.accessStartedAt,
      displayed: succeeded.displaySucceeded,
    });
    expect(
      await prisma.siteTabState.findUnique({
        where: { user_id: user.user_id },
      }),
    ).not.toBeNull();
    const laterAccess = new Date(
      new Date(failed.accessStartedAt).getTime() + 10_000,
    );
    await service.recordRegisteredSiteAccess({
      userId: user.user_id,
      accessStartedAt: laterAccess.toISOString(),
      displayed: true,
    });
    await service.recordRegisteredSiteAccess({
      userId: user.user_id,
      accessStartedAt: failed.accessStartedAt,
      displayed: true,
    });
    expect(
      (
        await prisma.siteTabState.findUniqueOrThrow({
          where: { user_id: user.user_id },
        })
      ).last_accessed_at,
    ).toEqual(laterAccess);
  });

  it("20 件境界をページングし、世代変更カーソルを拒否する", async () => {
    const user = await createUser("cursor");
    const site = await createSite(user.user_id, {
      lastSuccessAt: new Date(),
      cacheVersion: BigInt(1),
    });
    const firstSeenAt = new Date("2026-01-01T00:00:00.000Z");
    await createEntries(
      site.registered_site_id,
      Array.from({ length: 21 }, (_, index) => ({
        key: `entry-${String(index).padStart(3, "0")}`,
        url: `https://article.example.test/${index}`,
        firstSeenAt,
      })),
    );

    const first = await service.getRegisteredSitePageData({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
      operation: "page",
    });
    expect(first.entries).toHaveLength(20);
    expect(first.nextCursor).toBeTruthy();
    const second = await service.getRegisteredSitePageData({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
      cursor: first.nextCursor ?? undefined,
      operation: "page",
    });
    expect(second.entries).toHaveLength(1);
    expect(fetchFeedMock).not.toHaveBeenCalled();

    await prisma.registeredSite.update({
      where: { registered_site_id: site.registered_site_id },
      data: { cache_version: BigInt(2) },
    });
    await expect(
      service.getRegisteredSitePageData({
        userId: user.user_id,
        registeredSiteId: site.registered_site_id,
        cursor: first.nextCursor ?? undefined,
        operation: "page",
      }),
    ).rejects.toBeInstanceOf(FeedCursorStaleError);
  });

  it("公開日時の降順と不明日時の末尾を安定したカーソルで維持する", async () => {
    const user = await createUser("published-order");
    const site = await createSite(user.user_id, {
      lastSuccessAt: new Date(),
      cacheVersion: BigInt(1),
    });
    const firstSeenAt = new Date("2026-01-01T00:00:00.000Z");
    await createEntries(site.registered_site_id, [
      {
        key: "older",
        url: "https://article.example.test/older",
        publishedAt: new Date("2026-01-01T00:00:00.000Z"),
        firstSeenAt,
      },
      {
        key: "newer",
        url: "https://article.example.test/newer",
        publishedAt: new Date("2026-01-03T00:00:00.000Z"),
        firstSeenAt,
      },
      ...Array.from({ length: 19 }, (_, index) => ({
        key: `middle-${String(index).padStart(2, "0")}`,
        url: `https://article.example.test/middle-${index}`,
        publishedAt: new Date(
          `2025-12-${String(31 - index).padStart(2, "0")}T00:00:00.000Z`,
        ),
        firstSeenAt,
      })),
      {
        key: "unknown-1",
        url: "https://article.example.test/unknown",
        publishedAt: null,
        firstSeenAt,
      },
      {
        key: "unknown-2",
        url: "https://article.example.test/unknown-2",
        publishedAt: null,
        firstSeenAt,
      },
    ]);

    const first = await service.getRegisteredSitePageData({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
      operation: "page",
    });
    expect(first.entries).toHaveLength(20);
    expect(first.entries.slice(0, 2).map((entry) => entry.publishedAt)).toEqual(
      ["2026-01-03T00:00:00.000Z", "2026-01-01T00:00:00.000Z"],
    );
    expect(first.nextCursor).toBeTruthy();
    const second = await service.getRegisteredSitePageData({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
      cursor: first.nextCursor ?? undefined,
      operation: "page",
    });
    expect(second.entries).toHaveLength(3);
    expect(second.entries[0]?.publishedAt).toBe("2025-12-13T00:00:00.000Z");
    expect(second.entries.slice(1).map((entry) => entry.publishedAt)).toEqual([
      null,
      null,
    ]);
  });

  it("取得中の解除後に古い結果を保存しない", async () => {
    const user = await createUser("delete");
    const site = await createSite(user.user_id);
    let release: (() => void) | undefined;
    fetchFeedMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              url: "https://feed.example.test/feed",
              body: rss([
                { id: "deleted", url: "https://article.example.test/deleted" },
              ]),
              contentType: "application/rss+xml",
            });
        }),
    );
    const pending = service.refreshRegisteredSite({
      userId: user.user_id,
      registeredSiteId: site.registered_site_id,
    });
    await vi.waitFor(() => expect(fetchFeedMock).toHaveBeenCalledTimes(1));
    await prisma.registeredSite.delete({
      where: { registered_site_id: site.registered_site_id },
    });
    release?.();
    await expect(pending).rejects.toMatchObject({ name: "NotFoundError" });
    expect(
      await prisma.registeredSite.findUnique({
        where: { registered_site_id: site.registered_site_id },
      }),
    ).toBeNull();
    expect(
      await prisma.feedEntry.findMany({
        where: { registered_site_id: site.registered_site_id },
      }),
    ).toHaveLength(0);
  });
});
