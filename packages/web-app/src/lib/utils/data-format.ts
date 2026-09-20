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

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Tokyo",
});

const languageDisplayNames = new Intl.DisplayNames(["ja-JP"], {
  type: "language",
  fallback: "code",
});

/** Asia/Tokyo基準の日付文字列に変換する */
export function formatDateInTokyo(value: string | Date) {
  return dateFormatter.format(new Date(value));
}

/** Asia/Tokyo基準の日時文字列に変換する */
export function formatDateTimeInTokyo(value: string | Date) {
  return dateTimeFormatter.format(new Date(value));
}

/** Asia/Tokyo基準の時刻文字列に変換する */
export function formatTimeInTokyo(value: string | Date) {
  return timeFormatter.format(new Date(value));
}

/** 言語コードを日本語の表示名に変換する */
export function formatLanguageName(languageCode: string) {
  try {
    return languageDisplayNames.of(languageCode) ?? languageCode;
  } catch {
    return languageCode;
  }
}
