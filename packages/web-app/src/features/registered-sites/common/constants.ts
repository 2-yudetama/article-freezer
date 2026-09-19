/**
 * 登録サイト機能で共有する初期値
 *
 * 外部フィードの取得はリクエスト処理中に完了させるため、処理時間と
 * 受信量を全サイト共通の上限で制限する。上限を超えた応答は途中結果を
 * 保存せず、取得失敗として扱う。
 */
export const REGISTERED_SITE_CONFIG = {
  cacheTtlMs: 60 * 60 * 1000,
  fetchIntervalMs: 60 * 1000,
  fetchTimeoutMs: 10 * 1000,
  operationTimeoutMs: 50 * 1000,
  maxResponseBytes: 2 * 1024 * 1024,
  maxEntries: 200,
  maxDiscoveryCandidates: 8,
  maxRedirects: 3,
  pageSize: 20,
} as const;

export const REGISTERED_SITE_CURSOR_VERSION = 1;
