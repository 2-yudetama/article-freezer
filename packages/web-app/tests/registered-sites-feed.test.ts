import { describe, expect, it } from "vitest";
import { REGISTERED_SITE_CONFIG } from "@/features/registered-sites/common/constants";
import { FeedParseError } from "@/features/registered-sites/common/errors";
import { parseFeed } from "@/features/registered-sites/server/parse-feed";
import {
  normalizeHttpUrl,
  resolvePublicUrl,
} from "@/features/registered-sites/server/url-security";

describe("parseFeed", () => {
  it("RSS の記事 URL・画像・公開日時を解析する", () => {
    const result = parseFeed(`
      <rss version="2.0">
        <channel>
          <title>RSS example</title>
          <item>
            <guid>000entry-1</guid>
            <title><![CDATA[記事タイトル]]></title>
            <link>https://example.com/articles/1</link>
            <pubDate>Wed, 15 Jan 2025 12:00:00 GMT</pubDate>
            <media:thumbnail xmlns:media="http://search.yahoo.com/mrss/" url="https://example.com/image.png" />
          </item>
        </channel>
      </rss>
    `);

    expect(result).toMatchObject({
      format: "rss",
      title: "RSS example",
      entries: [
        {
          sourceEntryId: "000entry-1",
          articleUrl: "https://example.com/articles/1",
          title: "記事タイトル",
          thumbnailUrl: "https://example.com/image.png",
          publishedAt: new Date("2025-01-15T12:00:00.000Z"),
        },
      ],
    });
  });

  it("Atom は published を投稿日として扱い updated を代用しない", () => {
    const result = parseFeed(`
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Atom example</title>
        <entry>
          <id>tag:example.com,2025:1</id>
          <title>記事</title>
          <link rel="alternate" href="https://example.com/articles/1" />
          <published>2025-01-15T12:00:00Z</published>
          <updated>2025-02-15T12:00:00Z</updated>
        </entry>
      </feed>
    `);

    expect(result.entries[0]?.publishedAt).toEqual(
      new Date("2025-01-15T12:00:00.000Z"),
    );
  });

  it("記事 URL がない不完全な項目はフィード全体を失敗にする", () => {
    expect(() =>
      parseFeed(`
        <rss><channel><title>broken</title>
          <item><title>URLなし</title></item>
        </channel></rss>
      `),
    ).toThrow(FeedParseError);
  });

  it("RSS 1.0 は channel と兄弟の item を解析する", () => {
    const result = parseFeed(`
      <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <channel><title>RSS 1.0 example</title></channel>
        <item rdf:about="https://example.com/articles/1">
          <title>記事 1</title>
          <link>https://example.com/articles/1</link>
        </item>
      </rdf:RDF>
    `);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.articleUrl).toBe(
      "https://example.com/articles/1",
    );
  });

  it("壊れた XML や DTD / ENTITY を含む入力を拒否する", () => {
    expect(() => parseFeed("<rss><channel>")).toThrow(FeedParseError);
    expect(() =>
      parseFeed(`
        <!DOCTYPE rss [<!ENTITY title "unsafe">]>
        <rss><channel><title>&title;</title></channel></rss>
      `),
    ).toThrow(FeedParseError);
  });

  it("解析開始前に期限切れの操作を拒否する", () => {
    expect(() =>
      parseFeed("<rss><channel /></rss>", {
        deadlineAt: Date.now() - 1,
      }),
    ).toThrow(FeedParseError);
  });

  it("重複した記事識別子と記事数上限超過を拒否する", () => {
    expect(() =>
      parseFeed(`
        <rss><channel>
          <item><guid>same-id</guid><link>https://example.com/1</link></item>
          <item><guid>same-id</guid><link>https://example.com/2</link></item>
        </channel></rss>
      `),
    ).toThrow(FeedParseError);

    const items = Array.from(
      { length: REGISTERED_SITE_CONFIG.maxEntries + 1 },
      (_, index) =>
        `<item><guid>entry-${index}</guid><link>https://example.com/${index}</link></item>`,
    ).join("");
    expect(() => parseFeed(`<rss><channel>${items}</channel></rss>`)).toThrow(
      FeedParseError,
    );
  });
});

describe("normalizeHttpUrl", () => {
  it("認証情報や非 HTTP URL を拒否する", () => {
    expect(() => normalizeHttpUrl("ftp://example.com/feed")).toThrow();
    expect(() =>
      normalizeHttpUrl("https://user:password@example.com/feed"),
    ).toThrow();
    expect(normalizeHttpUrl("https://example.com/feed#fragment")).toBe(
      "https://example.com/feed",
    );
  });
});

describe("resolvePublicUrl", () => {
  it("IPv4 / IPv6 の内部アドレスと IPv4-mapped IPv6 を拒否する", async () => {
    for (const value of [
      "http://127.0.0.1/feed",
      "http://10.0.0.1/feed",
      "http://[::1]/feed",
      "http://[::ffff:127.0.0.1]/feed",
      "http://[fec0::1]/feed",
      "http://[fed0::1]/feed",
    ]) {
      await expect(resolvePublicUrl(value)).rejects.toMatchObject({
        name: "FeedFetchError",
        code: "ssrf",
      });
    }
  });
});
