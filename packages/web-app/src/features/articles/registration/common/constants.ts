/**
 * 記事保存フローで扱うステップ種別。
 */
export type RegistrationStep =
  | "url"
  | "extract"
  | "comment"
  | "tags"
  | "confirm";

/**
 * 記事保存フローの進捗表示で利用するステップ順序。
 */
export const REGISTRATION_STEP_ORDER = {
  url: 0,
  extract: 1,
  comment: 2,
  tags: 3,
  confirm: 4,
} as const satisfies Record<RegistrationStep, number>;
