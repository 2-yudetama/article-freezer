import * as v from "valibot";

export const RegisteredSiteUrlSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(2048),
  v.url(),
);

export const RegisteredSiteIdSchema = v.pipe(v.string(), v.uuid());

export const RegisteredSiteCursorSchema = v.object({
  version: v.literal(2),
  registeredSiteId: RegisteredSiteIdSchema,
  cacheVersion: v.string(),
  publishedAt: v.nullable(v.string()),
  entryKey: v.pipe(v.string(), v.minLength(1)),
});

export type RegisteredSiteCursor = v.InferOutput<
  typeof RegisteredSiteCursorSchema
>;

export const RegisterSiteRequestSchema = v.object({
  siteUrl: RegisteredSiteUrlSchema,
  // undefined は自動検出、null はフィードを使わないリンク登録を表す
  feedUrl: v.optional(v.nullable(RegisteredSiteUrlSchema)),
});

export const DiscoverFeedsRequestSchema = v.object({
  url: RegisteredSiteUrlSchema,
});

export const RecordSiteAccessRequestSchema = v.object({
  accessStartedAt: v.string(),
  displayed: v.boolean(),
});

export const RegisteredSiteSearchParamsSchema = v.object({
  siteId: v.optional(RegisteredSiteIdSchema),
  cursor: v.optional(v.string()),
  since: v.optional(v.string()),
  accessStartedAt: v.optional(v.string()),
  mode: v.optional(v.picklist(["initial", "page"])),
  refresh: v.optional(v.picklist(["true", "false"])),
});

export const FeedCandidateSchema = v.object({
  feedUrl: RegisteredSiteUrlSchema,
  title: v.pipe(v.string(), v.minLength(1)),
  format: v.picklist(["rss", "atom"]),
});
export type FeedCandidate = v.InferOutput<typeof FeedCandidateSchema>;

export type RegisteredSiteStatus =
  | "ready"
  | "link"
  | "loading"
  | "rate-limited"
  | "error";

export type RegisteredSiteView = {
  registeredSiteId: string;
  siteUrl: string;
  displayName: string;
  feedUrl: string | null;
  status: RegisteredSiteStatus;
  lastSuccessAt: string | null;
  fetchNotBefore: string | null;
  errorMessage?: string;
};

export type FeedEntryView = {
  feedEntryId: string;
  entryKey: string;
  articleUrl: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  isNew: boolean;
};

export type RegisteredSitePageData = {
  sites: RegisteredSiteView[];
  selectedSiteId: string | null;
  entries: FeedEntryView[];
  nextCursor: string | null;
  cacheVersion: string | null;
  accessBaseline: string;
  accessStartedAt: string;
  displaySucceeded: boolean;
  accessRecorded: boolean;
  cursorStale?: boolean;
  errorMessage?: string;
};
