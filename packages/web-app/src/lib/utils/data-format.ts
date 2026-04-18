const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Tokyo",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Tokyo",
});

/** Asia/Tokyo基準の日付文字列に変換する */
export function formatDateInTokyo(value: string | Date) {
  return dateFormatter.format(new Date(value));
}

/** Asia/Tokyo基準の日時文字列に変換する */
export function formatDateTimeInTokyo(value: string | Date) {
  return dateTimeFormatter.format(new Date(value));
}
