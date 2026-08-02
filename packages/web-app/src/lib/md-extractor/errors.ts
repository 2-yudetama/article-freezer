import * as v from "valibot";
import { MdExtractorRequestError } from "@/lib/errors";

/**
 * md-extractorのエラーレスポンス形式
 */
const MdExtractorErrorResponseSchema = v.object({
  name: v.string(),
  message: v.string(),
  details: v.nullish(v.array(v.string())),
});

/**
 * md-extractorのエラーレスポンスをアプリのカスタムエラーに変換する
 */
export async function toMdExtractorError(
  response: Response,
): Promise<MdExtractorRequestError> {
  const body = await response.json().catch(() => null);
  const result = v.safeParse(MdExtractorErrorResponseSchema, body);
  const message = result.success
    ? result.output.message
    : `md-extractor request failed with status ${response.status}.`;
  const responseName = result.success ? result.output.name : "Error";

  return new MdExtractorRequestError({
    message,
    responseName,
    responseStatus: response.status,
  });
}

/**
 * md-extractorのステータスコードとエラー名を、
 * App Routerでのレスポンスで用いるステータスコードとメッセージに変換する
 */
export function mapMdExtractorErrorResponse(
  status: number,
  name: string,
): {
  status: number;
  message: string;
} {
  if (name === "UnsafeArticleUrlError") {
    return {
      status: 400,
      message: "指定されたURLでは記事を抽出できません",
    };
  }

  if (name === "InvalidArticleUrlError") {
    return {
      status: 400,
      message: "URLを正しい形式で入力してください",
    };
  }

  if (name === "RequestValidationError") {
    return {
      status: 400,
      message: "URLを正しい形式で入力してください",
    };
  }

  if (name === "ArticleContentFetchError") {
    return {
      status: 502,
      message: "指定されたURLの記事を取得できませんでした",
    };
  }

  if (name === "ArticleContentRequestError") {
    return {
      status: 502,
      message: "指定されたURLに接続できませんでした",
    };
  }

  if (name === "ArticleContentTimeoutError") {
    return {
      status: 504,
      message: "記事の取得がタイムアウトしました",
    };
  }

  if (name === "UnsupportedArticleContentError") {
    return {
      status: 422,
      message: "指定されたURLの記事形式には対応していません",
    };
  }

  if (name === "ArticleContentConversionError") {
    return {
      status: 500,
      message: "取得した記事をMarkdownに変換できませんでした",
    };
  }

  if (name === "ArticleExtractionError") {
    return {
      status: 503,
      message: "取得した記事の内容を抽出できませんでした",
    };
  }

  if (name === "ArticleTranslationError") {
    return {
      status: 503,
      message: "記事の翻訳に失敗しました",
    };
  }

  if (status === 400) {
    return {
      status: 400,
      message: "リクエスト内容に不備があります",
    };
  }

  return {
    status: 502,
    message: "記事の抽出に失敗しました",
  };
}
