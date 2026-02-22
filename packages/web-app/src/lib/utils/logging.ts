import {
  ansiColorFormatter,
  configure,
  getConsoleSink,
  jsonLinesFormatter,
} from "@logtape/logtape";

const isProduction = process.env.NODE_ENV === "production";

/**
 * LogTapeの設定
 * @see https://logtape.org/manual/config
 */
export default async function configureLogTape() {
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: isProduction ? jsonLinesFormatter : ansiColorFormatter,
      }),
    },
    loggers: [
      { category: "web-app", lowestLevel: "info", sinks: ["console"] },
      { category: ["web-app", "api"], lowestLevel: "info", sinks: ["console"] },
      {
        category: ["web-app", "auth"],
        lowestLevel: isProduction ? "info" : "debug",
        sinks: ["console"],
      },
    ],
  });
}
