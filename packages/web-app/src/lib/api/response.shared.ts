import * as v from "valibot";

export const DEFAULT_ERROR_MESSAGE = "サーバでエラーが発生しました";

export const ApiErrorResponseSchema = v.object({
  name: v.string(),
  message: v.string(),
  details: v.optional(v.array(v.string())),
});
export type ApiErrorResponse = v.InferOutput<typeof ApiErrorResponseSchema>;

/**
 * APIレスポンスからエラーメッセージを取得する
 */
export async function getApiErrorMessage(
  response: Response,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
) {
  const result = v.safeParse(
    ApiErrorResponseSchema,
    await response.json().catch(() => null),
  );

  return result.success ? result.output.message : fallbackMessage;
}
