"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatDateTimeInTokyo,
  formatTimeInTokyo,
} from "@/lib/utils/data-format";
import type {
  RegisteredSitePageData,
  RegisteredSiteView,
} from "../common/types";
import AddRegisteredSiteDialog from "./AddRegisteredSiteDialog";
import RegisteredSiteArticleCard from "./RegisteredSiteArticleCard";

export type RegisteredSitesViewProps = {
  userId: string;
  data: RegisteredSitePageData;
  selectedSite: RegisteredSiteView | undefined;
  cursorPosition: number;
  isDeepLink: boolean;
  isLoading: boolean;
  remainingSeconds: number;
  selectSite: (siteId: string) => void;
  refresh: () => void;
  removeSite: () => void;
  goNext: () => void;
  goPrevious: () => void;
  reload: () => void;
};

export default function RegisteredSitesView({
  userId,
  data,
  selectedSite,
  cursorPosition,
  isDeepLink,
  isLoading,
  remainingSeconds,
  selectSite,
  refresh,
  removeSite,
  goNext,
  goPrevious,
  reload,
}: RegisteredSitesViewProps) {
  const hasFetchLimit = remainingSeconds > 0;
  const unavailableWithoutCache = Boolean(
    selectedSite?.feedUrl &&
      !selectedSite.lastSuccessAt &&
      (selectedSite.status === "error" ||
        selectedSite.status === "rate-limited"),
  );

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">登録サイト</h1>
          <p className="mt-2 text-muted-foreground">
            RSS / Atom の新着記事を確認して、必要な記事を保存できます
          </p>
        </div>
        <AddRegisteredSiteDialog userId={userId} onRegistered={reload} />
      </div>

      {data.errorMessage && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-2 p-4 text-destructive">
            <AlertCircle className="size-4" />
            {data.errorMessage}
          </CardContent>
        </Card>
      )}

      {data.sites.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-12 text-center">
            <h2 className="text-xl font-semibold">登録サイトがありません</h2>
            <p className="text-muted-foreground">
              サイトを追加すると、配信された記事をここで確認できます
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <Card className="h-fit">
            <CardContent className="space-y-2 p-3">
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                登録先 ({data.sites.length})
              </p>
              {data.sites.map((site) => (
                <button
                  key={site.registeredSiteId}
                  type="button"
                  onClick={() => selectSite(site.registeredSiteId)}
                  className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${
                    site.registeredSiteId === data.selectedSiteId
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="block truncate font-medium">
                    {site.displayName}
                  </span>
                  <span className="mt-1 block truncate text-xs opacity-70">
                    {site.status === "link"
                      ? "リンク登録"
                      : site.status === "error"
                        ? "取得失敗"
                        : site.status === "rate-limited"
                          ? "取得制限中"
                          : "フィード"}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          <section className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-semibold">
                  {selectedSite?.displayName ?? "登録サイト"}
                </h2>
                {selectedSite?.lastSuccessAt && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    最終更新:{" "}
                    {formatDateTimeInTokyo(selectedSite.lastSuccessAt)}
                  </p>
                )}
                {selectedSite?.fetchNotBefore && hasFetchLimit && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    次回更新可能:{" "}
                    {formatTimeInTokyo(selectedSite.fetchNotBefore)}
                    （あと {remainingSeconds} 秒）
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSite?.feedUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={
                      isLoading ||
                      selectedSite.status === "loading" ||
                      hasFetchLimit
                    }
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <RefreshCw />
                    )}
                    {selectedSite.status === "loading"
                      ? "更新中"
                      : "今すぐ更新"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeSite}
                  disabled={isLoading}
                >
                  <Trash2 />
                  登録解除
                </Button>
              </div>
            </div>

            {selectedSite?.status === "error" && (
              <Card className="border-destructive/50">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <span className="text-sm text-destructive">
                    {selectedSite.errorMessage ??
                      "フィードの取得に失敗しました"}
                  </span>
                  <Button
                    size="sm"
                    onClick={refresh}
                    disabled={isLoading || hasFetchLimit}
                  >
                    再試行
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedSite?.status === "link" ? (
              <Card>
                <CardContent className="space-y-3 p-8 text-center">
                  <p className="text-muted-foreground">
                    このサイトはリンクとして登録されています
                  </p>
                  <Button asChild variant="outline">
                    <a
                      href={selectedSite.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      サイトを開く
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : unavailableWithoutCache ? (
              <Card className="border-destructive/50">
                <CardContent className="p-12 text-center text-muted-foreground">
                  フィードを表示できません。状態を確認して再試行してください
                </CardContent>
              </Card>
            ) : data.entries.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  {selectedSite?.status === "loading"
                    ? "更新中です"
                    : "配信記事がありません"}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {data.entries.map((entry) => (
                  <RegisteredSiteArticleCard
                    key={entry.feedEntryId}
                    userId={userId}
                    siteName={selectedSite?.displayName ?? "登録サイト"}
                    entry={entry}
                  />
                ))}
              </div>
            )}

            {(data.nextCursor || cursorPosition > 0) && (
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrevious}
                  disabled={isLoading || cursorPosition <= 0}
                >
                  <ChevronLeft />
                  前へ
                </Button>
                <Badge variant="outline">
                  {isDeepLink ? "ページ位置" : `${cursorPosition + 1} ページ目`}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goNext}
                  disabled={isLoading || !data.nextCursor}
                >
                  次へ
                  <ChevronRight />
                </Button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
