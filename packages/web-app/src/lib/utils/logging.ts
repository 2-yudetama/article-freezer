import {
  configure,
  getAnsiColorFormatter,
  getConsoleSink,
  jsonLinesFormatter,
} from "@logtape/logtape";

const isProduction = process.env.NODE_ENV === "production";

const developmentFormatter = getAnsiColorFormatter({
  timestamp: "date-time-timezone",
  format({ timestamp, level, category, message, record }) {
    const properties = Object.keys(record.properties).length
      ? ` ${JSON.stringify(record.properties)}`
      : "";

    return `${timestamp ? `${timestamp}` : ""} ${level} ${category} | ${message}${properties}`;
  },
});

/**
 * LogTapeの設定
 * @see https://logtape.org/manual/config
 */
export default async function configureLogTape() {
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: isProduction ? jsonLinesFormatter : developmentFormatter,
      }),
    },
    loggers: [
      {
        category: ["logtape", "meta"], // logtape内部ログ
        lowestLevel: "warning",
        sinks: ["console"],
      },
      { category: "web-app", lowestLevel: "info", sinks: ["console"] },
      {
        category: ["web-app", "api"],
        lowestLevel: isProduction ? "info" : "debug",
        sinks: ["console"],
        parentSinks: "override",
      },
      {
        category: ["web-app", "auth"],
        lowestLevel: isProduction ? "info" : "debug",
        sinks: ["console"],
        parentSinks: "override",
      },
    ],
  });
}
