import * as v from "valibot";
import { DEFAULT_ERROR_MESSAGE } from "@/lib/api/response.shared";
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
  if (status === 401 && name === "UnauthorizedError") {
    return {
      status: 500,
      message: DEFAULT_ERROR_MESSAGE,
    };
  }

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
    if (status === 400) {
      return {
        status,
        message: "指定された記事の内容を抽出できませんでした",
      };
    }

    if (status === 500) {
      return {
        status,
        message: "記事の抽出結果を正しく取得できませんでした",
      };
    }

    if (status === 503) {
      return {
        status,
        message:
          "記事の抽出サービスが一時的に利用できません。時間をおいて再度お試しください",
      };
    }
  }

  if (name === "ArticleTranslationError") {
    if (status === 400) {
      return {
        status,
        message: "入力された記事を翻訳できませんでした",
      };
    }

    if (status === 500) {
      return {
        status,
        message: "記事の翻訳結果を正しく取得できませんでした",
      };
    }

    if (status === 503) {
      return {
        status,
        message:
          "記事の翻訳サービスが一時的に利用できません。時間をおいて再度お試しください",
      };
    }
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
