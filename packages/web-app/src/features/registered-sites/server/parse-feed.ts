import { createHash } from "node:crypto";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { REGISTERED_SITE_CONFIG } from "../common/constants";
import { FeedParseError } from "../common/errors";
import { isSafeArticleUrl, normalizeHttpUrl } from "./url-security";

export type ParsedFeedEntry = {
  entryKey: string;
  sourceEntryId: string | null;
  articleUrl: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
};

export type ParsedFeed = {
  format: "rss" | "atom";
  title: string;
  entries: ParsedFeedEntry[];
};

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  cdataPropName: "#cdata",
  ignoreAttributes: false,
  // 記事 ID は数値に見えても文字列として保持し、先頭 0 などを失わない
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: true,
  textNodeName: "#text",
  trimValues: true,
});

function ensureDeadline(deadlineAt?: number) {
  if (deadlineAt !== undefined && Date.now() >= deadlineAt) {
    throw new FeedParseError("フィードの解析が期限を超えました");
  }
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function localName(key: string) {
  const separator = key.lastIndexOf(":");
  return (separator >= 0 ? key.slice(separator + 1) : key).toLowerCase();
}

function findKey(value: Record<string, unknown>, names: string[]) {
  return Object.keys(value).find((key) => names.includes(localName(key)));
}

function child(value: unknown, names: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const key = findKey(value as Record<string, unknown>, names);
  return key ? (value as Record<string, unknown>)[key] : undefined;
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim();
  }
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(" ");
  if (typeof value !== "object") return "";

  const object = value as Record<string, unknown>;
  for (const key of ["#text", "#cdata"]) {
    if (key in object) return text(object[key]);
  }

  return Object.entries(object)
    .filter(([key]) => !key.startsWith("@_"))
    .map(([, nested]) => text(nested))
    .filter(Boolean)
    .join(" ");
}

function attribute(value: unknown, name: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const attributes = value as Record<string, unknown>;
  const key = Object.keys(attributes).find(
    (candidate) => candidate.toLowerCase() === `@_${name.toLowerCase()}`,
  );
  return key ? text(attributes[key]) : "";
}

function pickLink(value: unknown, atom = false) {
  const links = asArray(value);
  if (atom) {
    const alternate = links.find((link) => {
      const rel = attribute(link, "rel");
      return !rel || rel === "alternate";
    });
    return attribute(alternate, "href") || text(alternate);
  }

  for (const link of links) {
    const href = attribute(link, "href") || text(link);
    if (href) return href;
  }
  return "";
}

function findImage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImage(item);
      if (found) return found;
    }
    return null;
  }

  const object = value as Record<string, unknown>;
  const relation = attribute(value, "rel").toLowerCase();
  const mediaType = attribute(value, "type").toLowerCase();
  if (
    relation === "enclosure" &&
    (!mediaType || mediaType.startsWith("image/"))
  ) {
    const linkedImage = attribute(value, "href") || attribute(value, "url");
    if (linkedImage) return linkedImage;
  }
  for (const [key, nested] of Object.entries(object)) {
    if (key.startsWith("@_")) continue;
    const name = localName(key);
    if (["thumbnail", "content", "enclosure", "image"].includes(name)) {
      const nestedType = attribute(nested, "type").toLowerCase();
      if (nestedType && !nestedType.startsWith("image/")) continue;
      const candidate = attribute(nested, "url") || attribute(nested, "href");
      if (candidate) return candidate;
      const nestedUrl = child(nested, ["url", "href"]);
      const nestedText = text(nestedUrl);
      if (nestedText) return nestedText;
      const directText = text(nested);
      if (isSafeArticleUrl(directText)) return directText;
    }
    const found = findImage(nested);
    if (found) return found;
  }
  return null;
}

function parseDate(value: unknown) {
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function validateParsedEntries(entries: ParsedFeedEntry[]) {
  if (entries.length > REGISTERED_SITE_CONFIG.maxEntries) {
    throw new FeedParseError(
      `フィードの記事数が上限 (${REGISTERED_SITE_CONFIG.maxEntries} 件) を超えています`,
    );
  }

  const entryKeys = new Set<string>();
  for (const entry of entries) {
    if (entryKeys.has(entry.entryKey)) {
      throw new FeedParseError("フィード内に重複した記事識別子があります");
    }
    entryKeys.add(entry.entryKey);
  }
}

function parseEntry(
  value: unknown,
  format: "rss" | "atom",
): ParsedFeedEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const sourceEntryId = text(
    child(value, format === "rss" ? ["guid", "id"] : ["id"]),
  );
  const rawArticleUrl = pickLink(child(value, ["link"]), format === "atom");
  if (!isSafeArticleUrl(rawArticleUrl)) return null;

  let articleUrl: string;
  try {
    articleUrl = normalizeHttpUrl(rawArticleUrl);
  } catch {
    return null;
  }

  const title = text(child(value, ["title"])) || articleUrl;
  const rawThumbnailUrl = findImage(value);
  let thumbnailUrl: string | null = null;
  if (rawThumbnailUrl && isSafeArticleUrl(rawThumbnailUrl)) {
    try {
      thumbnailUrl = normalizeHttpUrl(rawThumbnailUrl);
    } catch {
      thumbnailUrl = null;
    }
  }

  const keySource = sourceEntryId || articleUrl;
  return {
    entryKey: hashKey(keySource),
    sourceEntryId: sourceEntryId || null,
    articleUrl,
    title,
    thumbnailUrl,
    publishedAt: parseDate(
      child(value, format === "rss" ? ["pubdate", "date"] : ["published"]),
    ),
  };
}

export function parseFeed(
  xml: string,
  options: { deadlineAt?: number } = {},
): ParsedFeed {
  ensureDeadline(options.deadlineAt);
  // fast-xml-parser は DTD を扱えるため、Entity 展開による負荷や外部参照を
  // 入力時点で拒否する。CDATA の本文は許可し、宣言構文だけを対象にする
  if (/<!(?:DOCTYPE|ENTITY|NOTATION)\b/i.test(xml)) {
    throw new FeedParseError("DTD / ENTITY を含むフィードは受け付けられません");
  }

  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new FeedParseError("フィードの XML が妥当ではありません");
  }

  let parsed: unknown;
  try {
    parsed = parser.parse(xml);
  } catch (_error) {
    throw new FeedParseError("フィードの XML を解析できませんでした");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new FeedParseError("フィードの形式を判定できませんでした");
  }
  ensureDeadline(options.deadlineAt);

  const rootObject = parsed as Record<string, unknown>;
  const rootKey = Object.keys(rootObject).find((key) =>
    ["rss", "rdf", "feed"].includes(localName(key)),
  );
  if (!rootKey) {
    throw new FeedParseError("RSS / Atom フィードではありません");
  }

  const rootName = localName(rootKey);
  const root = rootObject[rootKey];
  if (rootName === "feed") {
    const title = text(child(root, ["title"])) || "登録サイト";
    const rawEntries = asArray(child(root, ["entry"]));
    const entries = rawEntries.map((entry) => parseEntry(entry, "atom"));
    if (entries.some((entry) => entry === null)) {
      throw new FeedParseError("Atom の記事項目を解析できませんでした");
    }
    const validEntries = entries.filter(
      (entry): entry is ParsedFeedEntry => entry !== null,
    );
    ensureDeadline(options.deadlineAt);
    validateParsedEntries(validEntries);
    return {
      format: "atom",
      title,
      entries: validEntries,
    };
  }

  const channel = child(root, ["channel"]) ?? root;
  const title = text(child(channel, ["title"])) || "登録サイト";
  // RSS 1.0 (rdf:RDF) は channel と item がルート直下の兄弟になる
  const rawEntries = asArray(child(channel, ["item"]) ?? child(root, ["item"]));
  const entries = rawEntries.map((entry) => parseEntry(entry, "rss"));
  if (entries.some((entry) => entry === null)) {
    throw new FeedParseError("RSS の記事項目を解析できませんでした");
  }
  const validEntries = entries.filter(
    (entry): entry is ParsedFeedEntry => entry !== null,
  );
  ensureDeadline(options.deadlineAt);
  validateParsedEntries(validEntries);
  return {
    format: "rss",
    title,
    entries: validEntries,
  };
}
