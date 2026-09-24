import { REGISTERED_SITE_CONFIG } from "../common/constants";
import { FeedFetchError, FeedParseError } from "../common/errors";
import type { FeedCandidate } from "../common/types";
import { fetchBoundedFeed } from "./fetch-feed";
import { parseFeed } from "./parse-feed";
import { assertPublicUrl, normalizeHttpUrl } from "./url-security";

const HTML_TITLE_SCAN_LIMIT = 64 * 1024;

function getHtmlAttribute(tag: string, attributeName: string) {
  const match = tag.match(
    new RegExp(`${attributeName}\\s*=\\s*["']([^"']+)["']`, "i"),
  );
  return match?.[1] ?? null;
}

function getHtmlTitle(html: string) {
  const head = html.slice(0, HTML_TITLE_SCAN_LIMIT);
  const titleStart = head.search(/<title\b/i);
  if (titleStart < 0) return null;

  const contentStart = head.indexOf(">", titleStart + "<title".length) + 1;
  if (contentStart === 0) return null;

  const closingTag = "</title>";
  let titleEnd = head.indexOf("<", contentStart);
  while (titleEnd >= 0) {
    if (
      head.slice(titleEnd, titleEnd + closingTag.length).toLowerCase() ===
      closingTag
    ) {
      break;
    }
    titleEnd = head.indexOf("<", titleEnd + 1);
  }
  if (titleEnd < 0) return null;

  const rawTitle = head.slice(contentStart, titleEnd);
  if (!rawTitle) return null;
  const decoded = rawTitle
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, value: string) => {
      const codePoint = value.toLowerCase().startsWith("x")
        ? Number.parseInt(value.slice(1), 16)
        : Number.parseInt(value, 10);
      return !Number.isInteger(codePoint) ||
        codePoint < 0 ||
        codePoint > 0x10ffff
        ? ""
        : String.fromCodePoint(codePoint);
    })
    .replace(/&(?:amp|lt|gt|quot|apos);/gi, (value) => {
      const entities: Record<string, string> = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&apos;": "'",
      };
      return entities[value.toLowerCase()] ?? value;
    })
    .replace(/\s+/g, " ")
    .trim();
  return decoded || null;
}

function htmlFeedLinks(html: string, baseUrl: string) {
  const links = new Set<string>();
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const type = getHtmlAttribute(tag, "type")?.toLowerCase();
    if (
      type !== "application/rss+xml" &&
      type !== "application/atom+xml" &&
      type !== "application/xml" &&
      type !== "text/xml"
    ) {
      continue;
    }
    const href = getHtmlAttribute(tag, "href");
    if (!href) continue;
    try {
      links.add(normalizeHttpUrl(new URL(href, baseUrl).toString()));
    } catch {
      // 不正な候補は候補一覧から除外する
    }
  }
  return [...links];
}

export type FeedDiscoveryResult = {
  sourceUrl: string;
  siteUrl: string;
  siteTitle?: string;
  candidates: FeedCandidate[];
};

type DiscoveryOptions = {
  deadlineAt?: number;
};

export async function discoverFeeds(
  input: string,
  options: DiscoveryOptions = {},
): Promise<FeedDiscoveryResult> {
  const deadlineAt =
    options.deadlineAt ??
    Date.now() + REGISTERED_SITE_CONFIG.operationTimeoutMs;
  const sourceUrl = await assertPublicUrl(input, { deadlineAt });
  let response: Awaited<ReturnType<typeof fetchBoundedFeed>>;
  try {
    response = await fetchBoundedFeed(sourceUrl, { deadlineAt });
  } catch (error) {
    // URL の公開性を検査できた後の取得失敗は、フィード非対応として
    // リンク登録へフォールバックできるようにする。SSRF 検査自体は
    // assertPublicUrl と fetchBoundedFeed の両方で維持する
    if (error instanceof FeedFetchError && error.code !== "ssrf") {
      return { sourceUrl, siteUrl: sourceUrl, candidates: [] };
    }
    throw error;
  }

  try {
    const parsed = parseFeed(response.body, { deadlineAt });
    return {
      sourceUrl: response.url,
      siteUrl: sourceUrl,
      siteTitle: parsed.title,
      candidates: [
        {
          feedUrl: response.url,
          title: parsed.title,
          format: parsed.format,
        },
      ],
    };
  } catch (error) {
    if (!(error instanceof FeedParseError)) throw error;
    if (Date.now() >= deadlineAt) {
      throw new FeedFetchError("フィード検出がタイムアウトしました", "timeout");
    }
  }

  const contentType = response.contentType?.toLowerCase() ?? "";
  if (!contentType.includes("html") && !/<html\b/i.test(response.body)) {
    return { sourceUrl: response.url, siteUrl: sourceUrl, candidates: [] };
  }
  const siteTitle = getHtmlTitle(response.body);

  const candidates: FeedCandidate[] = [];
  const candidateUrls = htmlFeedLinks(response.body, response.url).slice(
    0,
    REGISTERED_SITE_CONFIG.maxDiscoveryCandidates,
  );
  for (const feedUrl of candidateUrls) {
    try {
      const feedResponse = await fetchBoundedFeed(feedUrl, { deadlineAt });
      const feed = parseFeed(feedResponse.body, { deadlineAt });
      candidates.push({
        feedUrl: feedResponse.url,
        title: feed.title,
        format: feed.format,
      });
    } catch (error) {
      if (error instanceof FeedFetchError && error.code === "ssrf") {
        throw error;
      }
      if (Date.now() >= deadlineAt) {
        return {
          sourceUrl: response.url,
          siteUrl: sourceUrl,
          ...(siteTitle ? { siteTitle } : {}),
          candidates,
        };
      }
      // 1つの候補が壊れていても、他の候補の検出は継続する
    }
  }

  if (Date.now() >= deadlineAt) {
    return {
      sourceUrl: response.url,
      siteUrl: sourceUrl,
      ...(siteTitle ? { siteTitle } : {}),
      candidates,
    };
  }

  return {
    sourceUrl: response.url,
    siteUrl: sourceUrl,
    ...(siteTitle ? { siteTitle } : {}),
    candidates,
  };
}
