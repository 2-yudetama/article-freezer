import { getLogger } from "@logtape/logtape";

/**
 * Auth.js用のカスタムロガー
 * - LogTapeのロガーを使う
 * @see https://authjs.dev/guides/debugging#logging
 */
export function authLogger() {
  // LogTapeのロガー作成
  const logger = getLogger(["web-app", "auth"]);

  return {
    warn(code: string) {
      logger.warn("Auth.js Warning", { code });
    },
    error(error: Error) {
      logger.error("Auth.js Error", {
        error,
      });
    },
    debug(message: string, metadata?: unknown) {
      logger.debug("Auth.js Debug", {
        message,
        metadata,
      });
    },
  };
}
