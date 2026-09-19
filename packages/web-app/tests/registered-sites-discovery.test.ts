import { describe, expect, it, vi } from "vitest";
import {
  FeedFetchError,
  FeedParseError,
} from "@/features/registered-sites/common/errors";

const fetchFeedMock = vi.hoisted(() => vi.fn());
const parseFeedMock = vi.hoisted(() => vi.fn());
const assertPublicUrlMock = vi.hoisted(() => vi.fn());
const normalizeHttpUrlMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/registered-sites/server/fetch-feed", () => ({
  fetchBoundedFeed: fetchFeedMock,
}));
vi.mock("@/features/registered-sites/server/parse-feed", () => ({
  parseFeed: parseFeedMock,
}));
vi.mock("@/features/registered-sites/server/url-security", () => ({
  assertPublicUrl: assertPublicUrlMock,
  normalizeHttpUrl: normalizeHttpUrlMock,
}));

import { discoverFeeds } from "@/features/registered-sites/server/discover-feeds";

describe("discoverFeeds", () => {
  it("候補の通信失敗をフィード非対応として扱わない", async () => {
    assertPublicUrlMock.mockResolvedValue("https://example.test/");
    normalizeHttpUrlMock.mockImplementation((value: string) => value);
    fetchFeedMock
      .mockResolvedValueOnce({
        url: "https://example.test/",
        body: '<html><link rel="alternate" type="application/rss+xml" href="/feed" /></html>',
        contentType: "text/html",
      })
      .mockRejectedValueOnce(new FeedFetchError("network", "network"));
    parseFeedMock.mockImplementation(() => {
      throw new FeedParseError("not a feed");
    });

    await expect(discoverFeeds("https://example.test/")).rejects.toMatchObject({
      name: "FeedFetchError",
      code: "network",
    });
  });

  it("候補リンクがない HTML はフィード非対応として返す", async () => {
    assertPublicUrlMock.mockResolvedValue("https://example.test/");
    fetchFeedMock.mockResolvedValueOnce({
      url: "https://example.test/",
      body: "<html><body>no feed</body></html>",
      contentType: "text/html",
    });
    parseFeedMock.mockImplementation(() => {
      throw new FeedParseError("not a feed");
    });

    await expect(discoverFeeds("https://example.test/")).resolves.toMatchObject(
      { candidates: [] },
    );
  });
});
