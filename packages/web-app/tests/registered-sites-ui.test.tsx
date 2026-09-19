/** @vitest-environment jsdom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  FeedEntryView,
  RegisteredSitePageData,
  RegisteredSiteView,
} from "@/features/registered-sites/common/types";
import { useRegisteredSites } from "@/features/registered-sites/hooks/use-registered-sites";
import RegisteredSitesView from "@/features/registered-sites/ui/RegisteredSitesView";

vi.mock("next/navigation", () => ({
  usePathname: () => "/users/user-1/registered-sites",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock("next/link", () => ({ default: "a" }));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

const USER_ID = "user-1";
const SITE_ID = "site-1";
const OTHER_SITE_ID = "site-2";
const BASELINE = "2026-09-19T00:00:00.000Z";
const STARTED_AT = "2026-09-19T00:01:00.000Z";
const NEXT_BASELINE = "2026-09-19T01:00:00.000Z";
const NEXT_STARTED_AT = "2026-09-19T01:01:00.000Z";

const fetchMock = vi.fn<typeof fetch>();
let root: Root | null = null;
let container: HTMLDivElement;
let latest: ReturnType<typeof useRegisteredSites> | null = null;
const originalConfirm = window.confirm;

function makeEntry(entryKey = "entry-1"): FeedEntryView {
  return {
    feedEntryId: `feed-${entryKey}`,
    entryKey,
    articleUrl: `https://example.com/articles/${entryKey}`,
    title: `記事 ${entryKey}`,
    thumbnailUrl: null,
    publishedAt: "2026-09-18T00:00:00.000Z",
    isNew: false,
  };
}

function makeSite(
  registeredSiteId = SITE_ID,
  overrides: Partial<RegisteredSiteView> = {},
): RegisteredSiteView {
  return {
    registeredSiteId,
    siteUrl: `https://example.com/${registeredSiteId}`,
    displayName: `サイト ${registeredSiteId}`,
    feedUrl: "https://example.com/feed.xml",
    status: "ready",
    lastSuccessAt: "2026-09-18T23:00:00.000Z",
    fetchNotBefore: null,
    ...overrides,
  };
}

function makeData(
  overrides: Partial<RegisteredSitePageData> = {},
): RegisteredSitePageData {
  return {
    sites: [makeSite()],
    selectedSiteId: SITE_ID,
    entries: [makeEntry()],
    nextCursor: null,
    cacheVersion: "cache-1",
    accessBaseline: BASELINE,
    accessStartedAt: STARTED_AT,
    displaySucceeded: true,
    accessRecorded: true,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requestUrls() {
  return fetchMock.mock.calls.map(([input]) => String(input));
}

function requestMethods() {
  return fetchMock.mock.calls.map(([, init]) => init?.method ?? "GET");
}

function currentHook() {
  if (!latest) throw new Error("hook is not mounted");
  return latest;
}

function HookHarness({ data }: { data: RegisteredSitePageData }) {
  latest = useRegisteredSites({ userId: USER_ID, ...data });
  return (
    <output data-display={latest.data.displaySucceeded ? "true" : "false"} />
  );
}

async function settle() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

async function mountHook(
  data: RegisteredSitePageData,
  url = "/users/user-1/registered-sites",
) {
  window.history.replaceState({}, "", url);
  root = createRoot(container);
  await act(async () => {
    root?.render(<HookHarness data={data} />);
  });
  await settle();
}

async function renderView(
  data: RegisteredSitePageData,
  remainingSeconds: number,
) {
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <RegisteredSitesView
        userId={USER_ID}
        data={data}
        selectedSite={data.sites.find(
          (site) => site.registeredSiteId === data.selectedSiteId,
        )}
        cursorPosition={0}
        isDeepLink={false}
        isLoading={false}
        remainingSeconds={remainingSeconds}
        selectSite={vi.fn()}
        refresh={vi.fn()}
        removeSite={vi.fn()}
        goNext={vi.fn()}
        goPrevious={vi.fn()}
        reload={vi.fn()}
      />,
    );
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.confirm = vi.fn(() => true);
  latest = null;
  window.history.replaceState({}, "", "/users/user-1/registered-sites");
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
    root = null;
  }
  latest = null;
  window.confirm = originalConfirm;
  container.remove();
});

describe("useRegisteredSites のページ位置と URL", () => {
  it("1→2→3→2→1を保持し、戻る・進むで既知の位置を復元する", async () => {
    await mountHook(makeData({ nextCursor: "cursor-2" }));

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({ entries: [makeEntry("entry-2")], nextCursor: "cursor-3" }),
      ),
    );
    latest?.goNext();
    await settle();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({ entries: [makeEntry("entry-3")], nextCursor: null }),
      ),
    );
    latest?.goNext();
    await settle();

    expect(latest?.cursorHistory).toEqual([null, "cursor-2", "cursor-3"]);
    expect(latest?.cursorPosition).toBe(2);
    expect(window.location.search).toContain("cursor=cursor-3");

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({ entries: [makeEntry("entry-2")], nextCursor: "cursor-3" }),
      ),
    );
    latest?.goPrevious();
    await settle();
    expect(latest?.cursorHistory).toEqual([null, "cursor-2", "cursor-3"]);
    expect(latest?.cursorPosition).toBe(1);

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({ entries: [makeEntry("entry-1")], nextCursor: "cursor-2" }),
      ),
    );
    latest?.goPrevious();
    await settle();
    expect(latest?.cursorPosition).toBe(0);
    expect(latest?.cursorHistory).toEqual([null, "cursor-2", "cursor-3"]);
    expect(window.location.search).toBe("?siteId=site-1&mode=page");
    expect(requestUrls().every((url) => !url.includes("mode=initial"))).toBe(
      true,
    );

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({ entries: [makeEntry("entry-3")], nextCursor: null }),
      ),
    );
    window.history.pushState(
      {},
      "",
      "/users/user-1/registered-sites?siteId=site-1&cursor=cursor-3&mode=page",
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
    await settle();
    expect(latest?.cursorHistory).toEqual([null, "cursor-2", "cursor-3"]);
    expect(latest?.cursorPosition).toBe(2);
    expect(latest?.data.entries[0]?.entryKey).toBe("entry-3");

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({ entries: [makeEntry("entry-2")], nextCursor: "cursor-3" }),
      ),
    );
    window.history.pushState(
      {},
      "",
      "/users/user-1/registered-sites?siteId=site-1&cursor=cursor-2&mode=page",
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
    await settle();
    expect(latest?.cursorPosition).toBe(1);
    expect(latest?.data.entries[0]?.entryKey).toBe("entry-2");
  });

  it("深いリンクは前へを無効にし、ページ番号を推測しない", async () => {
    await mountHook(
      makeData({ nextCursor: "cursor-3" }),
      "/users/user-1/registered-sites?siteId=site-1&cursor=cursor-2&mode=page",
    );

    expect(latest?.cursorHistory).toEqual(["cursor-2"]);
    expect(latest?.cursorPosition).toBe(0);
    expect(latest?.isDeepLink).toBe(true);
    latest?.goPrevious();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("手動更新で世代が変わったときは訪問履歴を先頭から作り直す", async () => {
    await mountHook(makeData({ nextCursor: "cursor-2" }));
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({ entries: [makeEntry("entry-2")], nextCursor: null }),
      ),
    );
    latest?.goNext();
    await settle();
    expect(latest?.cursorPosition).toBe(1);

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          makeData({
            cacheVersion: "cache-2",
            entries: [makeEntry("entry-2")],
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          makeData({
            cacheVersion: "cache-2",
            entries: [makeEntry("entry-1")],
            nextCursor: "cursor-2",
          }),
        ),
      );
    latest?.refresh();
    await settle();
    expect(latest?.cursorHistory).toEqual([null]);
    expect(latest?.cursorPosition).toBe(0);
    expect(window.location.search).toBe("?siteId=site-1&mode=page");
  });

  it("世代が変わったカーソルの409は先頭をDBから読み直す", async () => {
    await mountHook(makeData({ nextCursor: "cursor-2" }));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: "stale" }, 409))
      .mockResolvedValueOnce(
        jsonResponse(
          makeData({ entries: [makeEntry("entry-1")], nextCursor: "cursor-2" }),
        ),
      );

    latest?.goNext();
    await settle();

    expect(latest?.cursorHistory).toEqual([null]);
    expect(latest?.cursorPosition).toBe(0);
    expect(latest?.data.entries[0]?.entryKey).toBe("entry-1");
    expect(requestUrls()[1]).toContain("mode=page");
    expect(requestUrls()[1]).not.toContain("cursor=");
  });

  it("SSRの古いカーソル通知も URL を先頭へ戻す", async () => {
    const staleData = makeData({
      sites: [],
      selectedSiteId: null,
      entries: [],
      displaySucceeded: false,
      cursorStale: true,
    });
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({ entries: [makeEntry("entry-1")], nextCursor: "cursor-2" }),
      ),
    );
    await mountHook(
      staleData,
      "/users/user-1/registered-sites?siteId=site-1&cursor=cursor-2&mode=page",
    );
    await settle();
    expect(latest?.cursorHistory).toEqual([null]);
    expect(window.location.search).toBe("?siteId=site-1&mode=page");
    expect(requestUrls()[0]).toContain("mode=page");
    expect(requestUrls()[0]).not.toContain("cursor=");
  });

  it("競合する古いサイト応答を破棄する", async () => {
    const otherSite = makeSite(OTHER_SITE_ID);
    await mountHook(
      makeData({ sites: [makeSite(), otherSite], nextCursor: null }),
    );

    let resolveOld: (response: Response) => void = () => undefined;
    let resolveCurrent: (response: Response) => void = () => undefined;
    fetchMock.mockImplementation((input) => {
      const target = String(input);
      return new Promise<Response>((resolve) => {
        if (target.includes(OTHER_SITE_ID)) resolveOld = resolve;
        else resolveCurrent = resolve;
      });
    });

    latest?.selectSite(OTHER_SITE_ID);
    latest?.selectSite(SITE_ID);
    resolveCurrent(jsonResponse(makeData({ sites: [makeSite(), otherSite] })));
    await settle();
    resolveOld(
      jsonResponse(
        makeData({
          sites: [makeSite(), otherSite],
          selectedSiteId: OTHER_SITE_ID,
        }),
      ),
    );
    await settle();

    expect(latest?.data.selectedSiteId).toBe(SITE_ID);
  });
});

describe("useRegisteredSites の閲覧基準と取得結果", () => {
  it("描画後にだけ空状態のアクセスを記録し、セッション基準を固定する", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ recorded: true }));
    await mountHook(
      makeData({ accessRecorded: false, displaySucceeded: true }),
    );

    expect(requestMethods()).toEqual(["POST"]);
    expect(document.querySelector('[data-display="true"]')).not.toBeNull();
    expect(window.location.search).not.toContain("since=");
    expect(window.location.search).not.toContain("accessStartedAt=");
    const accessBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(accessBody.accessStartedAt).toBe(STARTED_AT);

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({
          entries: [makeEntry("entry-2")],
          nextCursor: null,
          accessBaseline: NEXT_BASELINE,
          accessStartedAt: NEXT_STARTED_AT,
        }),
      ),
    );
    latest?.selectSite(SITE_ID);
    await settle();
    const pageRequestUrl = requestUrls().find((url) => url.includes("siteId"));
    expect(pageRequestUrl).toContain(`since=${encodeURIComponent(BASELINE)}`);
    expect(pageRequestUrl).toContain(
      `accessStartedAt=${encodeURIComponent(STARTED_AT)}`,
    );
    expect(latest?.data.accessBaseline).toBe(BASELINE);
    expect(latest?.data.accessStartedAt).toBe(STARTED_AT);
  });

  it("新しいマウントでは URL の基準を再利用せず新しい閲覧基準を使う", async () => {
    await mountHook(
      makeData({ nextCursor: "cursor-2" }),
      "/users/user-1/registered-sites?siteId=site-1&cursor=cursor-2&mode=page",
    );
    expect(window.location.search).not.toContain("since=");
    expect(window.location.search).not.toContain("accessStartedAt=");

    await act(async () => root?.unmount());
    root = null;
    latest = null;
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({ nextCursor: null, entries: [makeEntry("entry-2")] }),
      ),
    );
    await mountHook(
      makeData({
        accessBaseline: NEXT_BASELINE,
        accessStartedAt: NEXT_STARTED_AT,
        nextCursor: "cursor-2",
      }),
      "/users/user-1/registered-sites?siteId=site-1&cursor=cursor-2&mode=page",
    );
    currentHook().goNext();
    await settle();
    expect(requestUrls()[0]).toContain(
      `since=${encodeURIComponent(NEXT_BASELINE)}`,
    );
    expect(requestUrls()[0]).toContain(
      `accessStartedAt=${encodeURIComponent(NEXT_STARTED_AT)}`,
    );
  });

  it("取得失敗後の再試行成功と空サイト表示を記録する", async () => {
    await mountHook(
      makeData({
        displaySucceeded: false,
        accessRecorded: false,
        entries: [],
        sites: [
          makeSite(SITE_ID, {
            status: "error",
            lastSuccessAt: null,
            errorMessage: "取得失敗",
          }),
        ],
      }),
    );
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          makeData({
            displaySucceeded: true,
            accessRecorded: false,
            entries: [],
            sites: [makeSite()],
          }),
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ recorded: true }));
    await act(async () => {
      latest?.refresh();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
    await settle();
    expect(requestMethods()).toEqual(["POST", "POST"]);
    expect(latest?.data.accessRecorded).toBe(true);

    await act(async () => root?.unmount());
    root = null;
    latest = null;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse({ recorded: true }));
    await mountHook(
      makeData({
        sites: [],
        selectedSiteId: null,
        entries: [],
        displaySucceeded: true,
        accessRecorded: false,
      }),
    );
    expect(requestMethods()).toEqual(["POST"]);
  });

  it("429の再試行時も既存キャッシュを維持して制限時刻を反映する", async () => {
    const existingEntry = makeEntry("existing");
    await mountHook(makeData({ entries: [existingEntry] }));
    const retryAt = new Date(Date.now() + 60_000).toISOString();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "too many", retryAt }, 429),
    );
    latest?.refresh();
    await settle();
    expect(latest?.data.entries).toEqual([existingEntry]);
    expect(latest?.selectedSite?.status).toBe("rate-limited");
    expect(latest?.remainingSeconds).toBeGreaterThan(0);
  });

  it("登録解除後は削除されたサイトを選択せず空状態へ移動する", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ deleted: true }))
      .mockResolvedValueOnce(
        jsonResponse(
          makeData({
            sites: [],
            selectedSiteId: null,
            entries: [],
            displaySucceeded: true,
            accessRecorded: false,
          }),
        ),
      );
    await mountHook(makeData());
    await act(async () => {
      await latest?.removeSite();
    });
    await settle();
    expect(requestMethods()).toEqual(["DELETE", "GET"]);
    expect(latest?.data.sites).toEqual([]);
    expect(latest?.data.selectedSiteId).toBeNull();
    expect(window.location.search).toBe("?mode=page");
  });
});

describe("RegisteredSitesView の取得制限表示", () => {
  it("日時をAsia/Tokyo基準で表示する", async () => {
    await renderView(
      makeData({
        sites: [
          makeSite(SITE_ID, {
            fetchNotBefore: "2026-09-19T00:02:00.000Z",
          }),
        ],
      }),
      12,
    );
    expect(container.textContent).toContain("最終更新: 2026/09/19 08:00");
    expect(container.textContent).toContain("次回更新可能: 09:02:00");
  });

  it("取得失敗時は空配信と表示せず、更新と再試行を無効にする", async () => {
    const data = makeData({
      entries: [],
      displaySucceeded: false,
      sites: [
        makeSite(SITE_ID, {
          status: "error",
          lastSuccessAt: null,
          fetchNotBefore: "2026-09-19T00:02:00.000Z",
          errorMessage: "フィード取得失敗",
        }),
      ],
    });
    await renderView(data, 12);
    const buttons = Array.from(container.querySelectorAll("button"));
    const refreshButton = buttons.find((button) =>
      button.textContent?.includes("今すぐ更新"),
    );
    const retryButton = buttons.find((button) =>
      button.textContent?.includes("再試行"),
    );
    expect(refreshButton?.disabled).toBe(true);
    expect(retryButton?.disabled).toBe(true);
    expect(container.textContent).toContain("フィードを表示できません");
    expect(container.textContent).not.toContain("配信記事がありません");
    expect(container.textContent).toContain("あと 12 秒");
  });

  it("リンク登録にはフィード更新操作を表示しない", async () => {
    await renderView(
      makeData({
        sites: [
          makeSite(SITE_ID, {
            status: "link",
            feedUrl: null,
            lastSuccessAt: null,
          }),
        ],
        entries: [],
        displaySucceeded: true,
      }),
      0,
    );
    expect(container.textContent).not.toContain("今すぐ更新");
    expect(container.textContent).toContain("リンクとして登録されています");
  });
});
