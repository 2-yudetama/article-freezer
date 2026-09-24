/** @vitest-environment jsdom */

import { act, StrictMode } from "react";
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
    hasNew: false,
    feedUrl: "https://example.com/feed.xml",
    status: "ready",
    lastSuccessAt: "2026-09-18T23:00:00.000Z",
    fetchNotBefore: null,
    ...overrides,
  };
}

function makeSites(count: number): RegisteredSiteView[] {
  return Array.from({ length: count }, (_, index) =>
    makeSite(`site-${index + 1}`),
  );
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
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
  strictMode = false,
) {
  window.history.replaceState({}, "", url);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      strictMode ? (
        <StrictMode>
          <HookHarness data={data} />
        </StrictMode>
      ) : (
        <HookHarness data={data} />
      ),
    );
  });
  await settle();
}

async function renderView(
  data: RegisteredSitePageData,
  remainingSeconds: number,
  cursorPosition = 0,
  options: {
    reorderSites?: (registeredSiteIds: string[]) => Promise<boolean>;
    isSavingOrder?: boolean;
  } = {},
) {
  root ??= createRoot(container);
  await act(async () => {
    root?.render(
      <RegisteredSitesView
        userId={USER_ID}
        data={data}
        selectedSite={data.sites.find(
          (site) => site.registeredSiteId === data.selectedSiteId,
        )}
        cursorPosition={cursorPosition}
        isDeepLink={false}
        isLoading={false}
        isSavingOrder={options.isSavingOrder}
        remainingSeconds={remainingSeconds}
        selectSite={vi.fn()}
        refresh={vi.fn()}
        removeSite={vi.fn()}
        goNext={vi.fn()}
        goPrevious={vi.fn()}
        reorderSites={options.reorderSites ?? vi.fn().mockResolvedValue(true)}
        reload={vi.fn()}
      />,
    );
  });
}

type RegisteredSitesLayoutMock = {
  setHeight: (height: number) => void;
  setListHeight: (list: HTMLElement, height: number) => void;
  triggerResize: () => void;
  restore: () => void;
};

let registeredSitesLayoutMock: RegisteredSitesLayoutMock | null = null;

function installRegisteredSitesLayoutMock(): RegisteredSitesLayoutMock {
  const originalResizeObserver = globalThis.ResizeObserver;
  const originalGetBoundingClientRect =
    HTMLElement.prototype.getBoundingClientRect;
  const observers = new Set<TestResizeObserver>();
  let availableHeight = 0;

  class TestResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {
      observers.add(this);
    }

    observe() {}

    disconnect() {
      observers.delete(this);
    }

    trigger() {
      this.callback([], this as unknown as ResizeObserver);
    }
  }

  const getBoundingClientRectSpy = vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      const list = this.parentElement;
      if (!list?.classList.contains("space-y-2")) {
        return originalGetBoundingClientRect.call(this);
      }

      const itemIndex = Array.from(list.children).indexOf(this);
      if (itemIndex < 0) {
        return originalGetBoundingClientRect.call(this);
      }

      const itemHeight = 44;
      const itemStep = 52;
      const top = itemIndex * itemStep;
      return {
        bottom: top + itemHeight,
        height: itemHeight,
        left: 0,
        right: 100,
        top,
        width: 100,
        x: 0,
        y: top,
        toJSON: () => ({}),
      } as DOMRect;
    });

  vi.stubGlobal("ResizeObserver", TestResizeObserver);

  return {
    setHeight: (height) => {
      availableHeight = height;
    },
    setListHeight: (list, height) => {
      availableHeight = height;
      Object.defineProperty(list, "clientHeight", {
        configurable: true,
        get: () => availableHeight,
      });
    },
    triggerResize: () => {
      for (const observer of observers) observer.trigger();
    },
    restore: () => {
      getBoundingClientRectSpy.mockRestore();
      vi.stubGlobal("ResizeObserver", originalResizeObserver);
    },
  };
}

function desktopSiteList(): HTMLElement {
  const list = container.querySelector('aside [class~="overflow-y-auto"]');
  if (!(list instanceof HTMLElement)) {
    throw new Error("登録先一覧が見つかりません");
  }
  return list;
}

function sitePaginationLabel(): string | undefined {
  return Array.from(container.querySelectorAll("aside span"))
    .map((element) => element.textContent?.trim())
    .find((text) => text && /^\d+ \/ \d+$/.test(text));
}

async function waitForSiteListButtonCount(
  list: HTMLElement,
  expectedCount: number,
) {
  await act(async () => {
    await vi.waitFor(() => {
      expect(list.querySelectorAll("button")).toHaveLength(expectedCount);
    });
  });
}

async function resizeSiteList(
  list: HTMLElement,
  height: number,
  expectedCount: number,
) {
  const layoutMock = registeredSitesLayoutMock;
  if (!layoutMock) throw new Error("登録先一覧の寸法モックがありません");
  layoutMock.setHeight(height);
  await act(async () => {
    layoutMock.triggerResize();
  });
  await waitForSiteListButtonCount(list, expectedCount);
}

async function waitForSitePagination(label: string) {
  await act(async () => {
    await vi.waitFor(() => {
      expect(sitePaginationLabel()).toBe(label);
    });
  });
}

async function goToNextSitePage() {
  const nextButton = container.querySelector<HTMLButtonElement>(
    '[aria-label="登録先の次のページ"]',
  );
  if (!nextButton) {
    throw new Error("登録先一覧の次ページボタンが見つかりません");
  }
  await act(async () => {
    nextButton.click();
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
  registeredSitesLayoutMock?.restore();
  registeredSitesLayoutMock = null;
  latest = null;
  window.confirm = originalConfirm;
  container.remove();
});

describe("useRegisteredSites のページ位置と URL", () => {
  it("通常アクセスでは期限切れ全体更新を一度だけ開始し、ページ移動では再取得しない", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({
          backgroundRefreshPending: false,
          entries: [makeEntry("updated-entry")],
          nextCursor: "cursor-2",
          sites: [makeSite(SITE_ID, { hasNew: true })],
        }),
      ),
    );
    await mountHook(makeData({ backgroundRefreshPending: true }));
    expect(requestMethods()).toEqual(["POST"]);
    expect(requestUrls()[0]).toContain("refresh-expired");
    expect(latest?.data.entries[0]?.entryKey).toBe("updated-entry");

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        makeData({
          entries: [makeEntry("page-entry")],
          nextCursor: null,
        }),
      ),
    );
    latest?.goNext();
    await settle();
    expect(requestMethods()).toEqual(["POST", "GET"]);
    expect(requestMethods().filter((method) => method === "POST")).toHaveLength(
      1,
    );
  });

  it("背景ループ完了後に期限切れ登録先を選択すると個別更新を再開し、ページ移動では外部取得しない", async () => {
    const selectedSiteResponse = deferred<Response>();
    const selectedRefreshResponse = deferred<Response>();
    const nextPageResponse = deferred<Response>();
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes("refresh-expired")) {
        return Promise.resolve(
          jsonResponse(
            makeData({
              sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
              selectedSiteId: SITE_ID,
              entries: [makeEntry("background-entry")],
              backgroundRefreshPending: false,
            }),
          ),
        );
      }
      if (url.includes(`/registered-sites/${OTHER_SITE_ID}/refresh`)) {
        return selectedRefreshResponse.promise;
      }
      if (url.includes("cursor=cursor-b2")) return nextPageResponse.promise;
      if (url.includes("/registered-sites?")) {
        return selectedSiteResponse.promise;
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    await mountHook(
      makeData({
        sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
        backgroundRefreshPending: true,
      }),
    );
    expect(
      requestUrls().filter((url) => url.includes("refresh-expired")),
    ).toHaveLength(2);
    expect(latest?.data.backgroundRefreshPending).toBe(false);

    latest?.selectSite(OTHER_SITE_ID);
    selectedSiteResponse.resolve(
      jsonResponse(
        makeData({
          sites: [
            makeSite(SITE_ID),
            makeSite(OTHER_SITE_ID, { status: "loading" }),
          ],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("cached-b")],
          cacheVersion: "cache-b",
          backgroundRefreshPending: true,
        }),
      ),
    );
    await settle();

    expect(requestMethods()).toEqual(["POST", "POST", "GET", "POST"]);
    expect(requestUrls()[3]).toContain(
      `/registered-sites/${OTHER_SITE_ID}/refresh`,
    );

    selectedRefreshResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("selected-refresh-entry")],
          nextCursor: "cursor-b2",
          cacheVersion: "cache-b2",
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();
    expect(latest?.data.entries[0]?.entryKey).toBe("selected-refresh-entry");

    latest?.goNext();
    nextPageResponse.resolve(
      jsonResponse(
        makeData({
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("page-entry")],
          nextCursor: null,
          cacheVersion: "cache-b2",
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();

    expect(requestMethods()).toEqual(["POST", "POST", "GET", "POST", "GET"]);
    expect(
      requestUrls().filter((url) => url.includes("refresh-expired")),
    ).toHaveLength(2);
    expect(
      requestUrls().filter((url) =>
        url.includes(`/registered-sites/${OTHER_SITE_ID}/refresh`),
      ),
    ).toHaveLength(1);
  });

  it("背景更新中に選択した登録先へ新しい先頭ページを反映し、個別更新を重ねない", async () => {
    const backgroundSecondResponse = deferred<Response>();
    const selectedSiteResponse = deferred<Response>();
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (
        url.includes("refresh-expired") &&
        url.includes(`siteId=${SITE_ID}`)
      ) {
        return Promise.resolve(
          jsonResponse(
            makeData({
              sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
              selectedSiteId: SITE_ID,
              entries: [makeEntry("background-a")],
              cacheVersion: "cache-a",
              backgroundRefreshPending: false,
            }),
          ),
        );
      }
      if (url.includes("refresh-expired")) {
        return backgroundSecondResponse.promise;
      }
      if (url.includes(`/registered-sites/${OTHER_SITE_ID}/refresh`)) {
        return Promise.reject(new Error("unexpected individual refresh"));
      }
      if (url.includes("/registered-sites?")) {
        return selectedSiteResponse.promise;
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    await mountHook(
      makeData({
        sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
        backgroundRefreshPending: true,
      }),
    );
    expect(requestMethods()).toEqual(["POST", "POST"]);

    latest?.selectSite(OTHER_SITE_ID);
    selectedSiteResponse.resolve(
      jsonResponse(
        makeData({
          sites: [
            makeSite(SITE_ID),
            makeSite(OTHER_SITE_ID, { status: "loading" }),
          ],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("cached-b")],
          nextCursor: "old-next",
          cacheVersion: "cache-old-b",
          backgroundRefreshPending: true,
        }),
      ),
    );
    await settle();
    expect(requestMethods()).toEqual(["POST", "POST", "GET"]);
    expect(latest?.data.entries[0]?.entryKey).toBe("cached-b");

    backgroundSecondResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("background-b-new")],
          nextCursor: "new-next",
          cacheVersion: "cache-new-b",
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();

    expect(latest?.data.selectedSiteId).toBe(OTHER_SITE_ID);
    expect(latest?.data.entries[0]?.entryKey).toBe("background-b-new");
    expect(latest?.data.nextCursor).toBe("new-next");
    expect(latest?.data.cacheVersion).toBe("cache-new-b");
    expect(latest?.data.backgroundRefreshPending).toBe(false);
    expect(requestMethods()).toEqual(["POST", "POST", "GET"]);
  });

  it("同じ登録先を再選択した古い取得結果の後にも背景結果を反映する", async () => {
    const backgroundResponse = deferred<Response>();
    const selectedSiteResponse = deferred<Response>();
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes("refresh-expired")) {
        return backgroundResponse.promise;
      }
      if (url.includes("/registered-sites?")) {
        return selectedSiteResponse.promise;
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    await mountHook(makeData({ backgroundRefreshPending: true }));
    expect(requestMethods()).toEqual(["POST"]);

    latest?.selectSite(SITE_ID);
    selectedSiteResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID, { status: "loading" })],
          selectedSiteId: SITE_ID,
          entries: [makeEntry("cached-a")],
          nextCursor: "old-next",
          cacheVersion: "cache-old-a",
          backgroundRefreshPending: true,
        }),
      ),
    );
    await settle();
    expect(latest?.data.entries[0]?.entryKey).toBe("cached-a");

    backgroundResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID)],
          selectedSiteId: SITE_ID,
          entries: [makeEntry("background-a-new")],
          nextCursor: "new-next",
          cacheVersion: "cache-new-a",
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();

    expect(latest?.data.entries[0]?.entryKey).toBe("background-a-new");
    expect(latest?.data.nextCursor).toBe("new-next");
    expect(latest?.data.cacheVersion).toBe("cache-new-a");
    expect(latest?.data.backgroundRefreshPending).toBe(false);
    expect(requestMethods()).toEqual(["POST", "GET"]);
  });

  it("手動更新中は同じ登録先の古い背景結果を適用せず手動結果を優先する", async () => {
    const backgroundResponse = deferred<Response>();
    const manualRefreshResponse = deferred<Response>();
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes("refresh-expired")) {
        return backgroundResponse.promise;
      }
      if (url.includes(`/registered-sites/${SITE_ID}/refresh`)) {
        return manualRefreshResponse.promise;
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    await mountHook(
      makeData({
        sites: [makeSite(SITE_ID, { status: "loading" })],
        entries: [makeEntry("cached-initial")],
        cacheVersion: "cache-initial",
        backgroundRefreshPending: true,
      }),
    );
    expect(requestMethods()).toEqual(["POST"]);

    latest?.refresh();
    await settle();
    expect(requestMethods()).toEqual(["POST", "POST"]);

    backgroundResponse.resolve(
      jsonResponse(
        makeData({
          sites: [
            makeSite(SITE_ID, {
              hasNew: true,
              lastSuccessAt: "2026-09-17T00:00:00.000Z",
            }),
          ],
          entries: [makeEntry("background-old")],
          cacheVersion: "cache-background-old",
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();
    expect(latest?.data.entries[0]?.entryKey).toBe("cached-initial");
    expect(latest?.data.cacheVersion).toBe("cache-initial");
    expect(latest?.data.sites[0]?.hasNew).toBe(false);
    expect(latest?.data.sites[0]?.lastSuccessAt).toBe(
      "2026-09-18T23:00:00.000Z",
    );
    expect(requestMethods()).toEqual(["POST", "POST"]);

    manualRefreshResponse.resolve(
      jsonResponse(
        makeData({
          entries: [makeEntry("manual-new")],
          cacheVersion: "cache-manual-new",
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();

    expect(latest?.data.entries[0]?.entryKey).toBe("manual-new");
    expect(latest?.data.cacheVersion).toBe("cache-manual-new");
    expect(latest?.isLoading).toBe(false);
    expect(requestMethods()).toEqual(["POST", "POST"]);
  });

  it("背景更新中の手動更新失敗をエラーとして完了する", async () => {
    const backgroundResponse = deferred<Response>();
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes("refresh-expired")) {
        return backgroundResponse.promise;
      }
      if (url.includes(`/registered-sites/${SITE_ID}/refresh`)) {
        return Promise.resolve(jsonResponse({ message: "manual failed" }, 500));
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    await mountHook(
      makeData({
        sites: [makeSite(SITE_ID, { status: "loading" })],
        backgroundRefreshPending: true,
      }),
    );
    latest?.refresh();
    await settle();

    expect(latest?.selectedSite?.status).toBe("error");
    expect(latest?.isLoading).toBe(false);
    expect(requestMethods()).toEqual(["POST", "POST"]);

    backgroundResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID)],
          entries: [makeEntry("background-old")],
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();
    expect(latest?.selectedSite?.status).toBe("error");
    expect(latest?.isLoading).toBe(false);
  });

  it("別サイトの2ページ目表示中に選択した登録先の背景結果を先頭へ反映する", async () => {
    const backgroundFirstResponse = deferred<Response>();
    const backgroundSecondResponse = deferred<Response>();
    const selectedSiteResponse = deferred<Response>();
    const firstSitePageResponse = deferred<Response>();
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (
        url.includes("refresh-expired") &&
        url.includes(`siteId=${SITE_ID}`)
      ) {
        return backgroundFirstResponse.promise;
      }
      if (url.includes("refresh-expired")) {
        return backgroundSecondResponse.promise;
      }
      if (url.includes("cursor=cursor-a2")) {
        return firstSitePageResponse.promise;
      }
      if (url.includes(`/registered-sites/${OTHER_SITE_ID}/refresh`)) {
        return Promise.reject(new Error("unexpected individual refresh"));
      }
      if (url.includes("/registered-sites?")) {
        return selectedSiteResponse.promise;
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    await mountHook(
      makeData({
        sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
        nextCursor: "cursor-a2",
        backgroundRefreshPending: true,
      }),
    );
    latest?.goNext();
    firstSitePageResponse.resolve(
      jsonResponse(
        makeData({
          selectedSiteId: SITE_ID,
          entries: [makeEntry("page-a-2")],
          nextCursor: null,
          cacheVersion: "cache-a",
          backgroundRefreshPending: true,
        }),
      ),
    );
    await settle();
    expect(latest?.cursorPosition).toBe(1);

    backgroundFirstResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
          selectedSiteId: SITE_ID,
          entries: [makeEntry("background-a-1")],
          nextCursor: "cursor-a2",
          cacheVersion: "cache-a",
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();
    expect(requestMethods()).toEqual(["POST", "GET", "POST"]);

    latest?.selectSite(OTHER_SITE_ID);
    selectedSiteResponse.resolve(
      jsonResponse(
        makeData({
          sites: [
            makeSite(SITE_ID),
            makeSite(OTHER_SITE_ID, { status: "loading" }),
          ],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("cached-b")],
          nextCursor: "old-next",
          cacheVersion: "cache-old-b",
          backgroundRefreshPending: true,
        }),
      ),
    );
    await settle();
    expect(requestMethods()).toEqual(["POST", "GET", "POST", "GET"]);

    backgroundSecondResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("background-b-new")],
          nextCursor: "new-next",
          cacheVersion: "cache-new-b",
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();

    expect(latest?.data.entries[0]?.entryKey).toBe("background-b-new");
    expect(latest?.data.nextCursor).toBe("new-next");
    expect(latest?.data.cacheVersion).toBe("cache-new-b");
    expect(latest?.cursorPosition).toBe(0);
    expect(requestMethods()).toEqual(["POST", "GET", "POST", "GET"]);
  });

  it("履歴の正規化と StrictMode の再設定後も期限切れ更新を続け、新着を全体へ反映する", async () => {
    const firstResponse = deferred<Response>();
    const secondResponse = deferred<Response>();
    const firstSite = makeSite(SITE_ID, { hasNew: false });
    const secondSite = makeSite(OTHER_SITE_ID, { hasNew: false });
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes(`siteId=${SITE_ID}`)) return firstResponse.promise;
      if (url.includes(`siteId=${OTHER_SITE_ID}`))
        return secondResponse.promise;
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    await mountHook(
      makeData({
        sites: [firstSite, secondSite],
        backgroundRefreshPending: true,
      }),
      "/users/user-1/registered-sites",
      true,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("?mode=page");

    firstResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID, { hasNew: true }), secondSite],
          entries: [makeEntry("background-first")],
          cacheVersion: "cache-background-first",
          backgroundRefreshPending: true,
        }),
      ),
    );
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    secondResponse.resolve(
      jsonResponse(
        makeData({
          sites: [
            makeSite(SITE_ID, { hasNew: true }),
            makeSite(OTHER_SITE_ID, { hasNew: true }),
          ],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("background-second")],
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();

    expect(latest?.data.entries[0]?.entryKey).toBe("background-first");
    expect(latest?.data.sites.map((site) => site.registeredSiteId)).toEqual([
      SITE_ID,
      OTHER_SITE_ID,
    ]);
    expect(latest?.data.sites.every((site) => site.hasNew)).toBe(true);
    expect(latest?.data.backgroundRefreshPending).toBe(false);
  });

  it("背景更新中の選択ページと並び順を古い応答で巻き戻さない", async () => {
    const backgroundFirst = deferred<Response>();
    const selectionResponse = deferred<Response>();
    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (init?.method === "PUT") return Promise.resolve(jsonResponse({}));
      if (
        url.includes("refresh-expired") &&
        url.includes(`siteId=${SITE_ID}`)
      ) {
        return backgroundFirst.promise;
      }
      if (url.includes("refresh-expired")) {
        return Promise.resolve(
          jsonResponse(
            makeData({
              sites: [
                makeSite(OTHER_SITE_ID, { hasNew: true }),
                makeSite(SITE_ID, { hasNew: true }),
              ],
              selectedSiteId: OTHER_SITE_ID,
              entries: [makeEntry("background-second")],
              cacheVersion: "cache-background-second",
            }),
          ),
        );
      }
      if (url.includes(`siteId=${OTHER_SITE_ID}`)) {
        return selectionResponse.promise;
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    await mountHook(
      makeData({
        sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
        backgroundRefreshPending: true,
      }),
    );
    latest?.selectSite(OTHER_SITE_ID);
    await act(async () => {
      await latest?.reorderSites([OTHER_SITE_ID, SITE_ID]);
    });

    selectionResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(OTHER_SITE_ID), makeSite(SITE_ID)],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("selected-page")],
        }),
      ),
    );
    await settle();

    await act(async () => {
      backgroundFirst.resolve(
        jsonResponse(
          makeData({
            sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
            selectedSiteId: SITE_ID,
            entries: [makeEntry("stale-background-page")],
          }),
        ),
      );
      await Promise.resolve();
    });
    await settle();
    await settle();

    expect(latest?.data.selectedSiteId).toBe(OTHER_SITE_ID);
    expect(latest?.data.entries[0]?.entryKey).toBe("background-second");
    expect(latest?.data.cacheVersion).toBe("cache-background-second");
    expect(latest?.data.sites.map((site) => site.registeredSiteId)).toEqual([
      OTHER_SITE_ID,
      SITE_ID,
    ]);
  });

  it("2 ページ目閲覧中の背景応答で先頭ページを上書きしない", async () => {
    const backgroundFirst = deferred<Response>();
    const backgroundSecond = deferred<Response>();
    const selectionResponse = deferred<Response>();
    const nextPageResponse = deferred<Response>();
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (
        url.includes("refresh-expired") &&
        url.includes(`siteId=${SITE_ID}`)
      ) {
        return backgroundFirst.promise;
      }
      if (url.includes("refresh-expired")) return backgroundSecond.promise;
      if (
        url.includes(`siteId=${OTHER_SITE_ID}`) &&
        url.includes("cursor=cursor-b2")
      ) {
        return nextPageResponse.promise;
      }
      if (url.includes(`siteId=${OTHER_SITE_ID}`)) {
        return selectionResponse.promise;
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    await mountHook(
      makeData({
        sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
        backgroundRefreshPending: true,
      }),
    );

    latest?.selectSite(OTHER_SITE_ID);
    selectionResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("page-b-1")],
          nextCursor: "cursor-b2",
          cacheVersion: "cache-b1",
          backgroundRefreshPending: true,
        }),
      ),
    );
    await settle();

    latest?.goNext();
    nextPageResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("page-b-2")],
          nextCursor: "cursor-b3",
          cacheVersion: "cache-b2",
          backgroundRefreshPending: true,
        }),
      ),
    );
    await settle();

    expect(latest?.cursorPosition).toBe(1);
    expect(window.location.search).toBe(
      `?siteId=${OTHER_SITE_ID}&cursor=cursor-b2&mode=page`,
    );

    backgroundFirst.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID, { hasNew: true }), makeSite(OTHER_SITE_ID)],
          selectedSiteId: SITE_ID,
          entries: [makeEntry("background-a-first")],
          nextCursor: "cursor-a2",
          cacheVersion: "cache-background-a",
        }),
      ),
    );
    await settle();

    backgroundSecond.resolve(
      jsonResponse(
        makeData({
          sites: [
            makeSite(SITE_ID, { hasNew: true }),
            makeSite(OTHER_SITE_ID, { hasNew: true }),
          ],
          selectedSiteId: OTHER_SITE_ID,
          entries: [makeEntry("background-b-first")],
          nextCursor: "cursor-b2",
          cacheVersion: "cache-background-b",
          backgroundRefreshPending: false,
        }),
      ),
    );
    await settle();

    expect(latest?.data.selectedSiteId).toBe(OTHER_SITE_ID);
    expect(latest?.data.entries[0]?.entryKey).toBe("page-b-2");
    expect(latest?.data.nextCursor).toBe("cursor-b3");
    expect(latest?.data.cacheVersion).toBe("cache-b2");
    expect(latest?.cursorHistory).toEqual([null, "cursor-b2"]);
    expect(latest?.cursorPosition).toBe(1);
    expect(window.location.search).toBe(
      `?siteId=${OTHER_SITE_ID}&cursor=cursor-b2&mode=page`,
    );
    expect(
      latest?.data.sites.find((site) => site.registeredSiteId === OTHER_SITE_ID)
        ?.hasNew,
    ).toBe(true);
  });

  it("先行登録先の更新失敗を後続応答で消さず、次の更新を続ける", async () => {
    const firstResponse = deferred<Response>();
    const secondResponse = deferred<Response>();
    const thirdResponse = deferred<Response>();
    const thirdSite = makeSite("site-3");
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes(`siteId=${SITE_ID}`)) return firstResponse.promise;
      if (url.includes(`siteId=${OTHER_SITE_ID}`))
        return secondResponse.promise;
      if (url.includes("siteId=site-3")) return thirdResponse.promise;
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });
    await mountHook(
      makeData({
        sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID), thirdSite],
        backgroundRefreshPending: true,
      }),
    );

    firstResponse.resolve(
      jsonResponse(
        makeData({
          sites: [
            makeSite(SITE_ID, { hasNew: true }),
            makeSite(OTHER_SITE_ID),
            thirdSite,
          ],
        }),
      ),
    );
    await settle();
    const secondPayload = makeData({
      sites: [
        makeSite(SITE_ID, { hasNew: true }),
        makeSite(OTHER_SITE_ID, {
          status: "error",
          errorMessage: "取得失敗",
        }),
        thirdSite,
      ],
      selectedSiteId: OTHER_SITE_ID,
    });
    secondResponse.resolve(jsonResponse(secondPayload));
    await settle();
    thirdResponse.resolve(
      jsonResponse(
        makeData({
          sites: [
            makeSite(SITE_ID, { hasNew: true }),
            makeSite(OTHER_SITE_ID),
            makeSite("site-3", { hasNew: true }),
          ],
          selectedSiteId: "site-3",
        }),
      ),
    );
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      latest?.data.sites.find(
        (site) => site.registeredSiteId === OTHER_SITE_ID,
      ),
    ).toMatchObject({ status: "error", errorMessage: "取得失敗" });
    expect(
      latest?.data.sites.find((site) => site.registeredSiteId === "site-3")
        ?.hasNew,
    ).toBe(true);
  });

  it("削除後に到着した古い背景応答で登録先を復活させない", async () => {
    const backgroundResponse = deferred<Response>();
    const deletedSite = makeSite(SITE_ID);
    const remainingSite = makeSite(OTHER_SITE_ID);
    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (url.includes("refresh-expired")) return backgroundResponse.promise;
      if (init?.method === "DELETE") {
        return Promise.resolve(jsonResponse({ deleted: true }));
      }
      return Promise.resolve(
        jsonResponse(
          makeData({
            sites: [remainingSite],
            selectedSiteId: OTHER_SITE_ID,
            entries: [makeEntry("remaining-entry")],
          }),
        ),
      );
    });

    await mountHook(
      makeData({
        sites: [deletedSite, remainingSite],
        backgroundRefreshPending: true,
      }),
    );
    await act(async () => {
      await latest?.removeSite();
    });
    expect(latest?.data.sites.map((site) => site.registeredSiteId)).toEqual([
      OTHER_SITE_ID,
    ]);

    await act(async () => {
      backgroundResponse.resolve(
        jsonResponse(
          makeData({
            sites: [deletedSite, remainingSite],
            selectedSiteId: SITE_ID,
            entries: [makeEntry("stale-deleted-entry")],
          }),
        ),
      );
      await Promise.resolve();
    });
    await settle();

    expect(latest?.data.sites.map((site) => site.registeredSiteId)).toEqual([
      OTHER_SITE_ID,
    ]);
    expect(latest?.data.selectedSiteId).toBe(OTHER_SITE_ID);
  });

  it("mode=page の直接アクセスでは期限切れ更新を開始しない", async () => {
    await mountHook(
      makeData({ backgroundRefreshPending: true }),
      "/users/user-1/registered-sites?siteId=site-1&mode=page",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

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

  it("並べ替えの保存中は同じ tick の次の保存を開始しない", async () => {
    const orderResponse = deferred<Response>();
    fetchMock.mockReturnValue(orderResponse.promise);
    await mountHook(
      makeData({ sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)] }),
    );

    const firstSave = currentHook().reorderSites([OTHER_SITE_ID, SITE_ID]);
    const secondSave = currentHook().reorderSites([SITE_ID, OTHER_SITE_ID]);
    expect(await secondSave).toBe(false);
    expect(requestMethods()).toEqual(["PUT"]);

    orderResponse.resolve(jsonResponse({}));
    expect(await firstSave).toBe(true);
    await settle();
    expect(
      currentHook().data.sites.map((site) => site.registeredSiteId),
    ).toEqual([OTHER_SITE_ID, SITE_ID]);
  });

  it("並べ替え保存の失敗では背景更新の状態を維持して順序だけ戻す", async () => {
    const orderResponse = deferred<Response>();
    const backgroundResponse = deferred<Response>();
    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (init?.method === "PUT") return orderResponse.promise;
      if (url.includes(`siteId=${SITE_ID}`)) return backgroundResponse.promise;
      if (url.includes(`siteId=${OTHER_SITE_ID}`)) {
        return Promise.resolve(
          jsonResponse(
            makeData({
              sites: [
                makeSite(SITE_ID, { hasNew: true }),
                makeSite(OTHER_SITE_ID),
              ],
            }),
          ),
        );
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });
    await mountHook(
      makeData({
        sites: [makeSite(SITE_ID), makeSite(OTHER_SITE_ID)],
        backgroundRefreshPending: true,
      }),
    );

    const save = currentHook().reorderSites([OTHER_SITE_ID, SITE_ID]);
    backgroundResponse.resolve(
      jsonResponse(
        makeData({
          sites: [makeSite(SITE_ID, { hasNew: true }), makeSite(OTHER_SITE_ID)],
        }),
      ),
    );
    await settle();
    orderResponse.resolve(jsonResponse({ message: "order failed" }, 500));

    expect(await save).toBe(false);
    await settle();
    expect(latest?.data.sites.map((site) => site.registeredSiteId)).toEqual([
      SITE_ID,
      OTHER_SITE_ID,
    ]);
    expect(latest?.data.sites[0]?.hasNew).toBe(true);
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
  it("登録直後の再読込でフィードを選択状態のまま表示する", async () => {
    await mountHook(
      makeData({
        sites: [],
        selectedSiteId: null,
        entries: [],
        nextCursor: null,
        cacheVersion: null,
        displaySucceeded: false,
        accessRecorded: true,
      }),
    );

    const loadingSite = makeSite(SITE_ID, {
      status: "loading",
      lastSuccessAt: null,
    });
    const registeredEntry = makeEntry("registered-entry");
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          makeData({
            sites: [loadingSite],
            selectedSiteId: SITE_ID,
            entries: [],
            nextCursor: null,
            cacheVersion: null,
            displaySucceeded: false,
            accessRecorded: true,
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          makeData({
            entries: [registeredEntry],
            cacheVersion: "cache-registered",
            accessRecorded: true,
          }),
        ),
      );

    latest?.reload(SITE_ID);
    await settle();
    await settle();

    expect(requestMethods()).toEqual(["GET", "POST"]);
    expect(latest?.data.selectedSiteId).toBe(SITE_ID);
    expect(latest?.data.entries[0]?.entryKey).toBe("registered-entry");
    expect(requestUrls()[0]).toContain(`siteId=${SITE_ID}`);
  });

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
    expect(latest?.isLoading).toBe(false);
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
  it("選択中のフィードに登録 URL のリンクを表示する", async () => {
    await renderView(makeData(), 0);

    const siteUrl = makeSite().siteUrl;
    const link = container.querySelector(`a[href="${siteUrl}"]`);
    expect(link?.textContent).toBe(siteUrl);
    expect(link?.textContent).toContain("https://example.com/site-1");
  });

  it("次ページ移動時は内側の一覧とモバイルの親を先頭へ移動する", async () => {
    const data = makeData({ nextCursor: "next-cursor" });
    await renderView(data, 0);

    const section = container.querySelector("section");
    expect(section).not.toBeNull();
    if (!section) return;
    const scrollIntoView = vi.fn();
    Object.defineProperty(section, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    section.scrollTop = 500;

    await renderView({ ...data, entries: [makeEntry("next-entry")] }, 0, 1);

    expect(section.scrollTop).toBe(0);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "auto",
    });
  });

  it("新着カードはサムネイルの上下余白と識別しやすい枠線を持つ", async () => {
    await renderView(
      makeData({
        entries: [{ ...makeEntry("new-entry"), isNew: true }],
      }),
      0,
    );

    const card = Array.from(
      container.querySelectorAll('[data-slot="card"]'),
    ).find((element) => element.className.includes("border-primary/70"));
    expect(card).not.toBeUndefined();
    expect(container.querySelector(".py-5")).not.toBeNull();
  });

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
    expect(container.textContent).not.toContain("サイトを開く");
  });

  it("並べ替えモードの上下操作を保存し、新着のみで一覧を絞り込む", async () => {
    const reorderSites = vi.fn().mockResolvedValue(true);
    await renderView(
      makeData({
        sites: [
          makeSite("site-1", { hasNew: false }),
          makeSite("site-2", { hasNew: true }),
          makeSite("site-3", { hasNew: false }),
        ],
      }),
      0,
      0,
      { reorderSites },
    );

    const sortButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="並べ替え"]',
    );
    expect(sortButton).not.toBeNull();
    await act(async () => sortButton?.click());

    const moveUpButtons = container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="サイト site-2を上へ移動"]',
    );
    expect(moveUpButtons.length).toBeGreaterThan(0);
    await act(async () => moveUpButtons[0]?.click());
    expect(reorderSites).toHaveBeenCalledWith(["site-2", "site-1", "site-3"]);

    const newOnlyButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="新着のみ"]',
    );
    expect(newOnlyButton).not.toBeNull();
    await act(async () => newOnlyButton?.click());
    expect(desktopSiteList().textContent).toContain("サイト site-2");
    expect(desktopSiteList().textContent).not.toContain("サイト site-1");
  });

  it("新着フィルターと並べ替えを同時に有効にせず全件で並べ替えられる", async () => {
    await renderView(
      makeData({
        sites: [
          makeSite("site-1", { hasNew: false }),
          makeSite("site-2", { hasNew: true }),
          makeSite("site-3", { hasNew: false }),
        ],
      }),
      0,
    );

    const newOnlyButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="新着のみ"]',
    );
    expect(newOnlyButton).not.toBeNull();
    await act(async () => newOnlyButton?.click());
    expect(newOnlyButton?.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('button[aria-label="並べ替え完了"]')).toBe(
      null,
    );

    const sortButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="並べ替え"]',
    );
    expect(sortButton).not.toBeNull();
    await act(async () => sortButton?.click());
    expect(
      container.querySelector('button[aria-label="並べ替え完了"]'),
    ).not.toBe(null);
    expect(newOnlyButton?.getAttribute("aria-pressed")).toBe("false");
    expect(desktopSiteList().textContent).toContain("サイト site-1");
    expect(desktopSiteList().textContent).toContain("サイト site-2");
    expect(desktopSiteList().textContent).toContain("サイト site-3");

    const completeButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="並べ替え完了"]',
    );
    await act(async () => completeButton?.click());
    const filterAgainButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="新着のみ"]',
    );
    await act(async () => filterAgainButton?.click());
    expect(filterAgainButton?.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('button[aria-label="並べ替え完了"]')).toBe(
      null,
    );
  });

  it("ドラッグでは隣接項目の下や末尾へ移動でき、pointercancelでは保存しない", async () => {
    const reorderSites = vi.fn().mockResolvedValue(true);
    const initialData = makeData({ sites: makeSites(3) });
    await renderView(initialData, 0, 0, { reorderSites });
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="並べ替え"]')
        ?.click();
    });

    const target = container.querySelector<HTMLElement>(
      '[data-registered-site-id="site-2"]',
    );
    const grip = container.querySelector<HTMLButtonElement>(
      'button[aria-label="サイト site-1をドラッグして移動"]',
    );
    expect(target).not.toBeNull();
    expect(grip).not.toBeNull();
    if (!target || !grip) return;
    const elementFromPoint = vi.fn().mockReturnValue(target);
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: elementFromPoint,
    });
    const pointerEvent = (type: string) =>
      new Event(type, { bubbles: true, cancelable: true });

    await act(async () => {
      grip.dispatchEvent(pointerEvent("pointerdown"));
    });
    await act(async () => {
      window.dispatchEvent(pointerEvent("pointermove"));
    });
    await act(async () => {
      window.dispatchEvent(pointerEvent("pointerup"));
    });
    expect(reorderSites).toHaveBeenLastCalledWith([
      "site-2",
      "site-1",
      "site-3",
    ]);

    await renderView(
      makeData({
        sites: [makeSite("site-2"), makeSite("site-1"), makeSite("site-3")],
      }),
      0,
      0,
      { reorderSites },
    );
    const lastTarget = container.querySelector<HTMLElement>(
      '[data-registered-site-id="site-3"]',
    );
    const movedGrip = container.querySelector<HTMLButtonElement>(
      'button[aria-label="サイト site-1をドラッグして移動"]',
    );
    expect(lastTarget).not.toBeNull();
    expect(movedGrip).not.toBeNull();
    if (!lastTarget || !movedGrip) return;
    elementFromPoint.mockReturnValue(lastTarget);
    await act(async () => {
      movedGrip.dispatchEvent(pointerEvent("pointerdown"));
    });
    await act(async () => {
      window.dispatchEvent(pointerEvent("pointermove"));
    });
    await act(async () => {
      window.dispatchEvent(pointerEvent("pointerup"));
    });
    expect(reorderSites).toHaveBeenLastCalledWith([
      "site-2",
      "site-3",
      "site-1",
    ]);

    await renderView(makeData({ sites: makeSites(3) }), 0, 0, { reorderSites });
    const cancelTarget = container.querySelector<HTMLElement>(
      '[data-registered-site-id="site-2"]',
    );
    const cancelGrip = container.querySelector<HTMLButtonElement>(
      'button[aria-label="サイト site-1をドラッグして移動"]',
    );
    expect(cancelTarget).not.toBeNull();
    expect(cancelGrip).not.toBeNull();
    if (!cancelTarget || !cancelGrip) return;
    const callCount = reorderSites.mock.calls.length;
    elementFromPoint.mockReturnValue(cancelTarget);
    await act(async () => {
      cancelGrip.dispatchEvent(pointerEvent("pointerdown"));
      window.dispatchEvent(pointerEvent("pointermove"));
      window.dispatchEvent(pointerEvent("pointercancel"));
    });
    expect(reorderSites).toHaveBeenCalledTimes(callCount);
    delete (document as { elementFromPoint?: unknown }).elementFromPoint;
  });

  it("保存中のキーボード操作を抑止する", async () => {
    const reorderSites = vi.fn().mockResolvedValue(true);
    const data = makeData({ sites: makeSites(2) });
    await renderView(data, 0, 0, { reorderSites });
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="並べ替え"]')
        ?.click();
    });
    await renderView(data, 0, 0, {
      reorderSites,
      isSavingOrder: true,
    });
    const grip = container.querySelector<HTMLButtonElement>(
      'button[aria-label="サイト site-1をドラッグして移動"]',
    );
    expect(grip).not.toBeNull();
    await act(async () => {
      grip?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
    });
    expect(reorderSites).not.toHaveBeenCalled();
  });

  it("並べ替えによる一覧順の更新ではモバイル一覧を閉じない", async () => {
    const reorderSites = vi.fn().mockResolvedValue(true);
    const data = makeData({ sites: makeSites(3) });
    await renderView(data, 0, 0, { reorderSites });
    const trigger = container.querySelector<HTMLButtonElement>(
      '[data-slot="collapsible-trigger"]',
    );
    expect(trigger).not.toBeNull();
    await act(async () => trigger?.click());
    expect(
      container
        .querySelector('[data-slot="collapsible-content"]')
        ?.getAttribute("data-state"),
    ).toBe("open");

    await renderView(
      makeData({
        sites: [makeSite("site-2"), makeSite("site-1"), makeSite("site-3")],
      }),
      0,
      0,
      { reorderSites },
    );
    expect(
      container
        .querySelector('[data-slot="collapsible-content"]')
        ?.getAttribute("data-state"),
    ).toBe("open");
  });

  it("新着フィルターの切り替えではモバイル一覧を閉じず結果を表示する", async () => {
    await renderView(
      makeData({
        sites: [
          makeSite("site-1", { hasNew: false }),
          makeSite("site-2", { hasNew: true }),
          makeSite("site-3", { hasNew: false }),
        ],
      }),
      0,
    );
    const trigger = container.querySelector<HTMLButtonElement>(
      '[data-slot="collapsible-trigger"]',
    );
    expect(trigger).not.toBeNull();
    await act(async () => trigger?.click());

    const content = container.querySelector(
      '[data-slot="collapsible-content"]',
    );
    expect(content?.getAttribute("data-state")).toBe("open");
    const newOnlyButton = content?.querySelector<HTMLButtonElement>(
      'button[aria-label="新着のみ"]',
    );
    expect(newOnlyButton).not.toBeNull();
    await act(async () => newOnlyButton?.click());

    expect(content?.getAttribute("data-state")).toBe("open");
    expect(content?.textContent).toContain("サイト site-2");
    expect(content?.textContent).not.toContain("サイト site-1");
  });

  it("新着フィルターで隠れている登録先の増減ではモバイル一覧を閉じる", async () => {
    await renderView(
      makeData({
        selectedSiteId: OTHER_SITE_ID,
        sites: [
          makeSite(SITE_ID, { hasNew: false }),
          makeSite(OTHER_SITE_ID, { hasNew: true }),
          makeSite("site-3", { hasNew: false }),
        ],
      }),
      0,
    );
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>('[data-slot="collapsible-trigger"]')
        ?.click(),
    );
    const content = container.querySelector(
      '[data-slot="collapsible-content"]',
    );
    const newOnlyButton = content?.querySelector<HTMLButtonElement>(
      'button[aria-label="新着のみ"]',
    );
    await act(async () => newOnlyButton?.click());
    expect(content?.getAttribute("data-state")).toBe("open");

    await renderView(
      makeData({
        selectedSiteId: OTHER_SITE_ID,
        sites: [
          makeSite(OTHER_SITE_ID, { hasNew: true }),
          makeSite("site-3", { hasNew: false }),
        ],
      }),
      0,
    );
    expect(content?.getAttribute("data-state")).toBe("closed");
  });
});

describe("RegisteredSitesView の可変ページ表示", () => {
  it("十分な高さでは10件以上を1ページに表示する", async () => {
    registeredSitesLayoutMock = installRegisteredSitesLayoutMock();
    await renderView(makeData({ sites: makeSites(20) }), 0);

    const list = desktopSiteList();
    registeredSitesLayoutMock.setListHeight(list, 620);
    await resizeSiteList(list, 620, 12);

    expect(list.textContent).toContain("サイト site-12");
    expect(sitePaginationLabel()).toBe("1 / 2");
  });

  it("高さを縮めると1ページの表示件数が減り、ページ数が増える", async () => {
    registeredSitesLayoutMock = installRegisteredSitesLayoutMock();
    await renderView(makeData({ sites: makeSites(20) }), 0);

    const list = desktopSiteList();
    registeredSitesLayoutMock.setListHeight(list, 620);
    await resizeSiteList(list, 620, 12);
    await waitForSitePagination("1 / 2");

    await resizeSiteList(list, 250, 4);
    expect(sitePaginationLabel()).toBe("1 / 5");
  });

  it("最後のページ表示中に高さを広げても一覧を空にせずページを補正する", async () => {
    registeredSitesLayoutMock = installRegisteredSitesLayoutMock();
    await renderView(makeData({ sites: makeSites(10) }), 0);

    const list = desktopSiteList();
    registeredSitesLayoutMock.setListHeight(list, 250);
    await resizeSiteList(list, 250, 4);
    await waitForSitePagination("1 / 3");

    await goToNextSitePage();
    await waitForSitePagination("2 / 3");
    await goToNextSitePage();
    await waitForSitePagination("3 / 3");

    await resizeSiteList(list, 620, 10);
    expect(sitePaginationLabel()).toBeUndefined();
    expect(list.textContent).toContain("サイト site-10");
  });
});
