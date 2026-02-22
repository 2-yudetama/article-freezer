import configureLogTape from "@/lib/utils/logging";

/**
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  // LogTapeの設定
  await configureLogTape();
}
