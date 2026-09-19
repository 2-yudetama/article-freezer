import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REGISTERED_SITE_CONFIG } from "@/features/registered-sites/common/constants";
import { FeedFetchError } from "@/features/registered-sites/common/errors";

const resolvePublicUrlMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/registered-sites/server/url-security", () => ({
  resolvePublicUrl: resolvePublicUrlMock,
}));

import { fetchBoundedFeed } from "@/features/registered-sites/server/fetch-feed";

describe("fetchBoundedFeed", () => {
  beforeEach(() => {
    resolvePublicUrlMock.mockResolvedValue({
      url: "https://feed.example.test/feed",
      address: "93.184.216.34",
      family: 4,
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("応答本文の読み取りまで共通期限を適用する", async () => {
    let bodyController: ReadableStreamDefaultController<Uint8Array> | null =
      null;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        bodyController = controller;
      },
    });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (_input, init) => {
      init?.signal?.addEventListener("abort", () => {
        bodyController?.error(new DOMException("aborted", "AbortError"));
      });
      return new Response(body);
    });

    await expect(
      fetchBoundedFeed("https://feed.example.test/feed", {
        deadlineAt: Date.now() + 40,
      }),
    ).rejects.toMatchObject({
      name: "FeedFetchError",
      code: "timeout",
    });
  });

  it("本文の上限を Content-Length がない応答にも適用する", async () => {
    const fetchMock = vi.mocked(fetch);
    const oversizedBody = new Uint8Array(
      REGISTERED_SITE_CONFIG.maxResponseBytes + 1,
    );
    fetchMock.mockResolvedValue(new Response(oversizedBody));

    await expect(
      fetchBoundedFeed("https://feed.example.test/feed", {
        deadlineAt: Date.now() + 1000,
      }),
    ).rejects.toMatchObject({
      name: "FeedFetchError",
      code: "too-large",
    });
  });

  it("リダイレクトごとに解決結果を更新する", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "https://feed.example.test/redirected" },
        }),
      )
      .mockResolvedValueOnce(
        new Response("<rss><channel><title>ok</title></channel></rss>"),
      );
    resolvePublicUrlMock
      .mockResolvedValueOnce({
        url: "https://feed.example.test/feed",
        address: "93.184.216.34",
        family: 4,
      })
      .mockResolvedValueOnce({
        url: "https://feed.example.test/redirected",
        address: "93.184.216.35",
        family: 4,
      });

    const result = await fetchBoundedFeed("https://feed.example.test/feed", {
      deadlineAt: Date.now() + 1000,
    });

    expect(result.url).toBe("https://feed.example.test/redirected");
    expect(resolvePublicUrlMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("DNS の全体期限エラーをネットワークエラーへ変換しない", async () => {
    resolvePublicUrlMock.mockRejectedValueOnce(
      new FeedFetchError("timeout", "timeout"),
    );

    await expect(
      fetchBoundedFeed("https://feed.example.test/feed", {
        deadlineAt: Date.now() + 1000,
      }),
    ).rejects.toMatchObject({ code: "timeout" });
  });
});
