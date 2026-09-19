export class FeedInputError extends Error {
  constructor(message = "Invalid feed URL.", options?: ErrorOptions) {
    super(message, options);
    this.name = "FeedInputError";
  }
}

export class FeedFetchError extends Error {
  readonly code:
    | "network"
    | "timeout"
    | "http"
    | "too-large"
    | "redirect"
    | "ssrf";

  constructor(
    message: string,
    code: FeedFetchError["code"],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "FeedFetchError";
    this.code = code;
  }
}

export class FeedParseError extends Error {
  constructor(message = "The feed response could not be parsed.") {
    super(message);
    this.name = "FeedParseError";
  }
}

export class FeedCandidatesError extends Error {
  readonly candidates: readonly unknown[];

  constructor(candidates: readonly unknown[]) {
    super("複数のフィード候補から選択してください");
    this.name = "FeedCandidatesError";
    this.candidates = candidates;
  }
}

export class FeedRateLimitError extends Error {
  readonly retryAt: Date;

  constructor(retryAt: Date) {
    super("The feed cannot be fetched yet.");
    this.name = "FeedRateLimitError";
    this.retryAt = retryAt;
  }
}

export class FeedCursorStaleError extends Error {
  constructor() {
    super("The feed list has changed.");
    this.name = "FeedCursorStaleError";
  }
}
