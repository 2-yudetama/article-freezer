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
      logger.warn("[Auth] Auth.js Warning: {code}", { code });
    },
    error(error: Error) {
      logger.error(
        "[Auth] Auth.js Error: {name} \n message: {message} \n cause: {cause} \n stack: {stack}",
        {
          name: error.name,
          message: error.message,
          cause: error.cause,
          stack: error.stack,
        },
      );
    },
    debug(message: string, metadata?: unknown) {
      const strMetadata = metadata ? JSON.stringify(metadata, null, 2) : "";

      logger.debug(
        `[Auth] Auth.js Debug: ${message} \n metadata: ${strMetadata}`,
        {
          message,
          metadata,
        },
      );
    },
  };
}
