import { Agent, Client } from "undici";
import { REGISTERED_SITE_CONFIG } from "../common/constants";
import { FeedFetchError } from "../common/errors";
import { resolvePublicUrl } from "./url-security";

type BoundedFetchResult = {
  url: string;
  body: string;
  contentType: string | null;
};

type ResolvedUrl = Awaited<ReturnType<typeof resolvePublicUrl>>;

async function readBoundedBody(response: Response) {
  const length = response.headers.get("content-length");
  if (length && Number(length) > REGISTERED_SITE_CONFIG.maxResponseBytes) {
    throw new FeedFetchError(
      "フィードの応答サイズが上限を超えています",
      "too-large",
    );
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > REGISTERED_SITE_CONFIG.maxResponseBytes) {
        await reader.cancel();
        throw new FeedFetchError(
          "フィードの応答サイズが上限を超えています",
          "too-large",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

/** DNS で検査したアドレスへ接続を固定して DNS rebinding を防ぐ。 */
function createPinnedDispatcher(resolved: ResolvedUrl) {
  return new Agent({
    factory(origin, options) {
      const clientOptions = (options ?? {}) as NonNullable<
        ConstructorParameters<typeof Client>[1]
      >;
      return new Client(origin, {
        ...clientOptions,
        connect: {
          ...(typeof clientOptions.connect === "object"
            ? clientOptions.connect
            : {}),
          lookup: (
            _hostname: string,
            options: { all?: boolean } | undefined,
            callback: (
              error: NodeJS.ErrnoException | null,
              address: string | Array<{ address: string; family: number }>,
              family?: number,
            ) => void,
          ) => {
            if (options?.all) {
              callback(null, [
                { address: resolved.address, family: resolved.family },
              ]);
            } else {
              callback(null, resolved.address, resolved.family);
            }
          },
        },
      });
    },
  });
}

function timeoutError(error: unknown) {
  return new FeedFetchError("フィードの取得がタイムアウトしました", "timeout", {
    cause: error,
  });
}

async function resolveBeforeDeadline(
  inputUrl: string,
  deadlineAt: number,
  signal: AbortSignal,
) {
  if (Date.now() >= deadlineAt || signal.aborted) throw timeoutError(undefined);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      resolvePublicUrl(inputUrl, { deadlineAt }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(timeoutError(undefined)),
          Math.max(1, deadlineAt - Date.now()),
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function fetchBoundedFeed(
  inputUrl: string,
  options: { deadlineAt?: number } = {},
): Promise<BoundedFetchResult> {
  const deadlineAt =
    options.deadlineAt ?? Date.now() + REGISTERED_SITE_CONFIG.fetchTimeoutMs;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.max(1, deadlineAt - Date.now()),
  );
  let current: ResolvedUrl;
  try {
    current = await resolveBeforeDeadline(
      inputUrl,
      deadlineAt,
      controller.signal,
    );
    for (
      let redirect = 0;
      redirect <= REGISTERED_SITE_CONFIG.maxRedirects;
      redirect += 1
    ) {
      if (Date.now() >= deadlineAt) throw timeoutError(undefined);
      const dispatcher = createPinnedDispatcher(current);
      const requestTimeout = setTimeout(
        () => controller.abort(),
        Math.max(
          1,
          Math.min(
            deadlineAt,
            Date.now() + REGISTERED_SITE_CONFIG.fetchTimeoutMs,
          ) - Date.now(),
        ),
      );
      let response: Response;
      try {
        response = await fetch(current.url, {
          signal: controller.signal,
          redirect: "manual",
          headers: {
            accept:
              "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8",
            "user-agent": "article-freezer/registered-sites",
          },
          dispatcher,
        } as RequestInit & { dispatcher: Agent });
      } catch (error) {
        clearTimeout(requestTimeout);
        await dispatcher.close();
        if (
          controller.signal.aborted ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          throw timeoutError(error);
        }
        if (error instanceof FeedFetchError) throw error;
        throw new FeedFetchError("フィードの取得に失敗しました", "network", {
          cause: error,
        });
      }

      try {
        if (response.status >= 300 && response.status < 400) {
          await response.body?.cancel();
          const location = response.headers.get("location");
          if (!location || redirect === REGISTERED_SITE_CONFIG.maxRedirects) {
            throw new FeedFetchError(
              "フィードのリダイレクト回数が上限を超えています",
              "redirect",
            );
          }
          let redirectUrl: string;
          try {
            redirectUrl = new URL(location, current.url).toString();
          } catch (error) {
            throw new FeedFetchError(
              "フィードのリダイレクト先が正しくありません",
              "redirect",
              { cause: error },
            );
          }
          current = await resolveBeforeDeadline(
            redirectUrl,
            deadlineAt,
            controller.signal,
          );
          continue;
        }

        if (!response.ok) {
          throw new FeedFetchError(
            `フィード取得先が HTTP ${response.status} を返しました`,
            "http",
          );
        }

        const body = await readBoundedBody(response);
        return {
          url: current.url,
          body,
          contentType: response.headers.get("content-type"),
        };
      } catch (error) {
        if (error instanceof FeedFetchError) throw error;
        if (
          controller.signal.aborted ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          throw timeoutError(error);
        }
        throw new FeedFetchError("フィードの取得に失敗しました", "network", {
          cause: error,
        });
      } finally {
        clearTimeout(requestTimeout);
        await dispatcher.close();
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  throw new FeedFetchError("フィードの取得に失敗しました", "redirect");
}
