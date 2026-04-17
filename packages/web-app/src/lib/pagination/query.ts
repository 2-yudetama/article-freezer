import type { SearchParamValue } from "./types";

/**
 * query 値から先頭の値を取得する
 */
export function toFirstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * query 値を配列として取得する
 */
export function toArrayParam(value: SearchParamValue): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

/**
 * page query を有効なページ番号として取得する
 */
export function parsePageParam(value: SearchParamValue): number {
  const page = Number(toFirstParam(value));

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}
