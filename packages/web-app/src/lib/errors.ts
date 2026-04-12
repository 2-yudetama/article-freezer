/**
 * カスタムエラー定義
 */

/** リクエスト形式が不正な場合のエラー */
export class InvalidRequestError extends Error {
  constructor(message = "Invalid request.", options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidRequestError";
  }
}

/** レスポンス形式が不正な場合のエラー */
export class InvalidResponseError extends Error {
  constructor(message = "Invalid response.", options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidResponseError";
  }
}

/** md-extractor 接続に必要な環境変数が設定されていない場合のエラー */
export class MdExtractorEnvironmentError extends Error {
  constructor(
    message = "md-extractor environment variables are not configured.",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "MdExtractorEnvironmentError";
  }
}

/** md-extractor へのリクエストが失敗した場合のエラー */
export class MdExtractorRequestError extends Error {
  readonly responseName: string;
  readonly responseStatus: number;

  constructor({
    message,
    responseName,
    responseStatus,
    cause,
  }: {
    message: string;
    responseName: string;
    responseStatus: number;
    cause?: unknown;
  }) {
    super(message, { cause });
    this.name = "MdExtractorRequestError";
    this.responseName = responseName;
    this.responseStatus = responseStatus;
  }
}
