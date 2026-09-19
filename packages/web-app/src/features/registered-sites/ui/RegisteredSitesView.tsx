"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

const REGISTERED_SITE_LIST_PAGE_SIZE = 9;

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
  reload: (registeredSiteId?: string) => void;
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
  const [siteListPage, setSiteListPage] = useState(() => {
    const selectedIndex = data.sites.findIndex(
      (site) => site.registeredSiteId === data.selectedSiteId,
    );
    return selectedIndex < 0
      ? 0
      : Math.floor(selectedIndex / REGISTERED_SITE_LIST_PAGE_SIZE);
  });
  const [mobileSitesOpen, setMobileSitesOpen] = useState(false);
  const articleScrollRef = useRef<HTMLElement>(null);
  const previousCursorPositionRef = useRef(cursorPosition);
  const previousSiteIdsRef = useRef(
    data.sites.map((site) => site.registeredSiteId).join(","),
  );
  const previousSelectedSiteIdRef = useRef(data.selectedSiteId);
  const hasFetchLimit = remainingSeconds > 0;
  const unavailableWithoutCache = Boolean(
    selectedSite?.feedUrl &&
      !selectedSite.lastSuccessAt &&
      (selectedSite.status === "error" ||
        selectedSite.status === "rate-limited"),
  );
  const siteListPageCount = Math.max(
    1,
    Math.ceil(data.sites.length / REGISTERED_SITE_LIST_PAGE_SIZE),
  );
  const visibleSites = data.sites.slice(
    siteListPage * REGISTERED_SITE_LIST_PAGE_SIZE,
    (siteListPage + 1) * REGISTERED_SITE_LIST_PAGE_SIZE,
  );

  useEffect(() => {
    const siteIds = data.sites.map((site) => site.registeredSiteId).join(",");
    const siteListChanged = siteIds !== previousSiteIdsRef.current;
    const selectionChanged =
      data.selectedSiteId !== previousSelectedSiteIdRef.current;
    if (siteListChanged || selectionChanged) {
      const selectedIndex = data.sites.findIndex(
        (site) => site.registeredSiteId === data.selectedSiteId,
      );
      setSiteListPage(
        selectedIndex < 0
          ? 0
          : Math.floor(selectedIndex / REGISTERED_SITE_LIST_PAGE_SIZE),
      );
      setMobileSitesOpen(false);
    }
    previousSiteIdsRef.current = siteIds;
    previousSelectedSiteIdRef.current = data.selectedSiteId;
  }, [data.sites, data.selectedSiteId]);

  useEffect(() => {
    if (cursorPosition > previousCursorPositionRef.current) {
      const element = articleScrollRef.current;
      if (element) {
        element.scrollTop = 0;
        element.scrollIntoView?.({ block: "start", behavior: "auto" });
      }
    }
    previousCursorPositionRef.current = cursorPosition;
  }, [cursorPosition]);

  const renderSiteButton = (site: RegisteredSiteView, closeMobile = false) => (
    <button
      key={site.registeredSiteId}
      type="button"
      onClick={() => {
        selectSite(site.registeredSiteId);
        if (closeMobile) setMobileSitesOpen(false);
      }}
      className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${
        site.registeredSiteId === data.selectedSiteId
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted"
      }`}
    >
      <span className="block truncate font-medium">{site.displayName}</span>
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
  );

  return (
    <div className="container mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:h-screen md:overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">登録サイト</h1>
          <p className="mt-2 text-muted-foreground">
            RSS / Atom の新着記事を確認して、必要な記事を保存できます
          </p>
        </div>
        <AddRegisteredSiteDialog userId={userId} onRegistered={reload} />
      </div>

      {data.errorMessage && (
        <Card className="shrink-0 border-destructive/50">
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
        <div className="min-h-0 flex-1 md:grid md:grid-cols-[16rem_1fr] md:gap-6">
          <aside className="hidden min-h-0 md:flex">
            <Card className="h-full min-h-0 w-full">
              <CardContent className="flex min-h-0 w-full flex-col p-3">
                <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                  登録先 ({data.sites.length})
                </p>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto scrollbar-readable">
                  {visibleSites.map((site) => renderSiteButton(site))}
                </div>
                {siteListPageCount > 1 && (
                  <div className="flex shrink-0 items-center justify-between gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSiteListPage((page) => page - 1)}
                      disabled={siteListPage === 0}
                      aria-label="登録先の前のページ"
                    >
                      <ChevronLeft />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {siteListPage + 1} / {siteListPageCount}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSiteListPage((page) => page + 1)}
                      disabled={siteListPage === siteListPageCount - 1}
                      aria-label="登録先の次のページ"
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          <div className="min-h-0 min-w-0">
            <Collapsible
              open={mobileSitesOpen}
              onOpenChange={setMobileSitesOpen}
              className="mb-5 md:hidden"
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto w-full justify-between px-4 py-4"
                  >
                    <span className="min-w-0 text-left">
                      <span className="block text-xs text-muted-foreground">
                        選択中の登録先
                      </span>
                      <span className="mt-1 block truncate font-medium">
                        {selectedSite?.displayName ?? "登録サイト"}
                      </span>
                    </span>
                    <ChevronsUpDown />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-2 border-t p-3">
                    {data.sites.map((site) => renderSiteButton(site, true))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <section
              ref={articleScrollRef}
              className="min-w-0 space-y-5 md:h-full md:overflow-y-auto md:pr-2 md:scrollbar-readable"
            >
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
                  {selectedSite?.feedUrl && (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      登録 URL:{" "}
                      <a
                        href={selectedSite.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        {selectedSite.siteUrl}
                      </a>
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
                    {isDeepLink
                      ? "ページ位置"
                      : `${cursorPosition + 1} ページ目`}
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
        </div>
      )}
    </div>
  );
}
