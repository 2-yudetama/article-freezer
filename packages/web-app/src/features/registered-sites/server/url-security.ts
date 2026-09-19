import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { FeedFetchError, FeedInputError } from "../common/errors";

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return true;
  }

  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 0 || second === 168)) ||
    (first === 198 && (second === 18 || second === 19 || second === 51)) ||
    (first === 203 && second === 0 && parts[2] === 113) ||
    first >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.slice("::ffff:".length));
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("fec") ||
    normalized.startsWith("fed") ||
    normalized.startsWith("fee") ||
    normalized.startsWith("fef") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  );
}

export function normalizeHttpUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch (error) {
    throw new FeedInputError("URL の形式が正しくありません", { cause: error });
  }

  if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
    throw new FeedInputError("http または https の URL を指定してください");
  }
  if (parsed.username || parsed.password || !parsed.hostname) {
    throw new FeedInputError("認証情報を含む URL は指定できません");
  }

  parsed.hash = "";
  return parsed.toString();
}

type ResolvedPublicUrl = {
  url: string;
  address: string;
  family: 4 | 6;
};

async function withDeadline<T>(operation: Promise<T>, deadlineAt?: number) {
  if (deadlineAt === undefined) return operation;
  const remaining = deadlineAt - Date.now();
  if (remaining <= 0) {
    throw new FeedFetchError("フィードの取得がタイムアウトしました", "timeout");
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new FeedFetchError(
                "フィードの取得がタイムアウトしました",
                "timeout",
              ),
            ),
          remaining,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function resolvePublicUrl(
  value: string,
  options: { deadlineAt?: number } = {},
): Promise<ResolvedPublicUrl> {
  const normalized = normalizeHttpUrl(value);
  const parsed = new URL(normalized);
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "metadata.google.internal"
  ) {
    throw new FeedFetchError(
      "内部ネットワークへの URL は取得できません",
      "ssrf",
    );
  }

  const hostType = isIP(host);
  if (hostType === 4 && isPrivateIpv4(host)) {
    throw new FeedFetchError(
      "内部ネットワークへの URL は取得できません",
      "ssrf",
    );
  }
  if (hostType === 6 && isPrivateIpv6(host)) {
    throw new FeedFetchError(
      "内部ネットワークへの URL は取得できません",
      "ssrf",
    );
  }

  let addresses: Array<{ address: string; family: 4 | 6 }>;
  try {
    addresses = (await withDeadline(
      lookup(host, { all: true, verbatim: true }),
      options.deadlineAt,
    )) as Array<{ address: string; family: 4 | 6 }>;
  } catch (error) {
    if (error instanceof FeedFetchError) throw error;
    throw new FeedFetchError("URL のホスト名を解決できません", "network", {
      cause: error,
    });
  }

  if (
    addresses.length === 0 ||
    addresses.some((address) => {
      const addressType = isIP(address.address);
      return addressType === 4
        ? isPrivateIpv4(address.address)
        : addressType === 6
          ? isPrivateIpv6(address.address)
          : true;
    })
  ) {
    throw new FeedFetchError(
      "内部ネットワークへの URL は取得できません",
      "ssrf",
    );
  }

  const resolved = addresses[0];
  if (!resolved) {
    throw new FeedFetchError("URL のホスト名を解決できません", "network");
  }
  return {
    url: normalized,
    address: resolved.address,
    family: resolved.family,
  };
}

export async function assertPublicUrl(
  value: string,
  options: { deadlineAt?: number } = {},
) {
  const resolved = await resolvePublicUrl(value, options);
  return resolved.url;
}

export function isSafeArticleUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (
      HTTP_PROTOCOLS.has(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}
