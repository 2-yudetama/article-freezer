import { REGISTERED_SITE_CONFIG } from "../common/constants";
import { FeedFetchError, FeedParseError } from "../common/errors";
import type { FeedCandidate } from "../common/types";
import { fetchBoundedFeed } from "./fetch-feed";
import { parseFeed } from "./parse-feed";
import { assertPublicUrl, normalizeHttpUrl } from "./url-security";

function getHtmlAttribute(tag: string, attributeName: string) {
  const match = tag.match(
    new RegExp(`${attributeName}\\s*=\\s*["']([^"']+)["']`, "i"),
  );
  return match?.[1] ?? null;
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
  const response = await fetchBoundedFeed(sourceUrl, { deadlineAt });

  let sourceParseError: FeedParseError | null = null;
  try {
    const parsed = parseFeed(response.body, { deadlineAt });
    return {
      sourceUrl: response.url,
      siteUrl: sourceUrl,
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
    sourceParseError = error;
    if (Date.now() >= deadlineAt) {
      throw new FeedFetchError("フィード検出がタイムアウトしました", "timeout");
    }
  }

  const contentType = response.contentType?.toLowerCase() ?? "";
  if (!contentType.includes("html") && !/<html\b/i.test(response.body)) {
    throw (
      sourceParseError ??
      new FeedParseError("フィードの形式を判定できませんでした")
    );
  }

  const candidates: FeedCandidate[] = [];
  let candidateError: FeedFetchError | FeedParseError | null = null;
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
      if (error instanceof FeedFetchError || error instanceof FeedParseError) {
        candidateError ??= error;
      }
      if (Date.now() >= deadlineAt) {
        throw new FeedFetchError(
          "フィード検出がタイムアウトしました",
          "timeout",
        );
      }
      // 1つの候補が壊れていても、他の候補の検出は継続する
    }
  }

  if (Date.now() >= deadlineAt) {
    throw new FeedFetchError("フィード検出がタイムアウトしました", "timeout");
  }
  if (candidates.length === 0 && candidateError) throw candidateError;

  return { sourceUrl: response.url, siteUrl: sourceUrl, candidates };
}
