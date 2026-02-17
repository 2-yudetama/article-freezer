import * as v from "valibot";

/**
 * DB環境変数スキーマ
 */
const DbEnvSchema = v.object({
  POSTGRES_USER: v.string(),
  POSTGRES_PASSWORD: v.string(),
  POSTGRES_HOST: v.string(),
  POSTGRES_DB: v.string(),
});

/**
 * DBの環境変数を取得してDATABASE_URLを返却
 * @returns postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}
 */
export function getDatabaseUrl(): string {
  // 環境変数の存在チェック
  const result = v.safeParse(DbEnvSchema, {
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_DB: process.env.POSTGRES_DB,
  });
  if (!result.success) {
    throw new Error("DB environment value is required");
  }

  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_DB } =
    result.output;

  return `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}`;
}
