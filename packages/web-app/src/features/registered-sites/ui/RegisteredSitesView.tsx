"use client";

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  GripVertical,
  ListFilter,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

const DEFAULT_REGISTERED_SITE_LIST_PAGE_SIZE = 9;
const REGISTERED_SITE_LIST_ITEM_GAP_PX = 8;

export type RegisteredSitesViewProps = {
  userId: string;
  data: RegisteredSitePageData;
  selectedSite: RegisteredSiteView | undefined;
  cursorPosition: number;
  isDeepLink: boolean;
  isLoading: boolean;
  isSavingOrder?: boolean;
  remainingSeconds: number;
  selectSite: (siteId: string) => void;
  refresh: () => void;
  removeSite: () => void;
  goNext: () => void;
  goPrevious: () => void;
  reorderSites?: (registeredSiteIds: string[]) => Promise<boolean>;
  reload: (registeredSiteId?: string) => void;
};

export default function RegisteredSitesView({
  userId,
  data,
  selectedSite,
  cursorPosition,
  isDeepLink,
  isLoading,
  isSavingOrder = false,
  remainingSeconds,
  selectSite,
  refresh,
  removeSite,
  goNext,
  goPrevious,
  reorderSites = async () => false,
  reload,
}: RegisteredSitesViewProps) {
  const [siteListElement, setSiteListElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [siteListPageSize, setSiteListPageSize] = useState(
    DEFAULT_REGISTERED_SITE_LIST_PAGE_SIZE,
  );
  const [siteListPage, setSiteListPage] = useState(() => {
    const selectedIndex = data.sites.findIndex(
      (site) => site.registeredSiteId === data.selectedSiteId,
    );
    return selectedIndex < 0
      ? 0
      : Math.floor(selectedIndex / DEFAULT_REGISTERED_SITE_LIST_PAGE_SIZE);
  });
  const [mobileSitesOpen, setMobileSitesOpen] = useState(false);
  const [sortMode, setSortMode] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [draggedSiteId, setDraggedSiteId] = useState<string | null>(null);
  const [dragOverSiteId, setDragOverSiteId] = useState<string | null>(null);
  const articleScrollRef = useRef<HTMLElement>(null);
  const previousCursorPositionRef = useRef(cursorPosition);
  const previousSiteIdsRef = useRef(
    data.sites.map((site) => site.registeredSiteId).join(","),
  );
  const previousAllSiteIdsRef = useRef(
    data.sites.map((site) => site.registeredSiteId).join(","),
  );
  const previousSelectedSiteIdRef = useRef(data.selectedSiteId);
  const previousSiteListPageSizeRef = useRef(
    DEFAULT_REGISTERED_SITE_LIST_PAGE_SIZE,
  );
  const hasAppliedMeasuredPageSizeRef = useRef(false);
  const hasFetchLimit = remainingSeconds > 0;
  const unavailableWithoutCache = Boolean(
    selectedSite?.feedUrl &&
      !selectedSite.lastSuccessAt &&
      (selectedSite.status === "error" ||
        selectedSite.status === "rate-limited"),
  );
  const siteListPageCount = Math.max(
    1,
    Math.ceil(
      data.sites.filter((site) => !newOnly || site.hasNew).length /
        siteListPageSize,
    ),
  );
  const filteredSites = data.sites.filter((site) => !newOnly || site.hasNew);
  const visibleSites = filteredSites.slice(
    siteListPage * siteListPageSize,
    (siteListPage + 1) * siteListPageSize,
  );

  useEffect(() => {
    const list = siteListElement;
    if (!list) return;

    const measurePageSize = () => {
      if (list.clientHeight <= 0) return;
      const firstItem = list.firstElementChild;
      if (!(firstItem instanceof HTMLElement)) return;

      const firstItemRect = firstItem.getBoundingClientRect();
      if (firstItemRect.height <= 0) return;

      const secondItem = firstItem.nextElementSibling;
      const itemStep =
        secondItem instanceof HTMLElement
          ? secondItem.getBoundingClientRect().top - firstItemRect.top
          : firstItemRect.height + REGISTERED_SITE_LIST_ITEM_GAP_PX;
      if (itemStep <= 0) return;

      const nextPageSize = Math.max(
        1,
        Math.floor(
          (list.clientHeight + itemStep - firstItemRect.height) / itemStep,
        ),
      );
      setSiteListPageSize((currentPageSize) =>
        currentPageSize === nextPageSize ? currentPageSize : nextPageSize,
      );
    };

    measurePageSize();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measurePageSize);
    resizeObserver?.observe(list);

    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(measurePageSize);
    mutationObserver?.observe(list, { childList: true });

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [siteListElement]);

  useEffect(() => {
    const siteIds = filteredSites
      .map((site) => site.registeredSiteId)
      .join(",");
    const siteListChanged = siteIds !== previousSiteIdsRef.current;
    const selectionChanged =
      data.selectedSiteId !== previousSelectedSiteIdRef.current;
    const pageSizeChanged =
      siteListPageSize !== previousSiteListPageSizeRef.current;
    const previousAllSiteIds = previousAllSiteIdsRef.current.split(",");
    const currentAllSiteIds = data.sites.map((site) => site.registeredSiteId);
    const membershipChanged =
      previousAllSiteIds.length !== currentAllSiteIds.length ||
      previousAllSiteIds.some((siteId) => !currentAllSiteIds.includes(siteId));
    if (siteListChanged || selectionChanged) {
      const selectedIndex = filteredSites.findIndex(
        (site) => site.registeredSiteId === data.selectedSiteId,
      );
      setSiteListPage(
        selectedIndex < 0 ? 0 : Math.floor(selectedIndex / siteListPageSize),
      );
    } else if (pageSizeChanged) {
      const selectedIndex = filteredSites.findIndex(
        (site) => site.registeredSiteId === data.selectedSiteId,
      );
      if (!hasAppliedMeasuredPageSizeRef.current) {
        setSiteListPage(
          selectedIndex < 0 ? 0 : Math.floor(selectedIndex / siteListPageSize),
        );
        hasAppliedMeasuredPageSizeRef.current = true;
      } else {
        const lastPage = Math.max(0, siteListPageCount - 1);
        setSiteListPage((currentPage) => Math.min(currentPage, lastPage));
      }
    }
    if (membershipChanged || selectionChanged) setMobileSitesOpen(false);
    previousSiteIdsRef.current = siteIds;
    previousAllSiteIdsRef.current = data.sites
      .map((site) => site.registeredSiteId)
      .join(",");
    previousSelectedSiteIdRef.current = data.selectedSiteId;
    previousSiteListPageSizeRef.current = siteListPageSize;
  }, [
    data.selectedSiteId,
    data.sites,
    filteredSites,
    siteListPageCount,
    siteListPageSize,
  ]);

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

  const moveSite = useCallback(
    (siteId: string, offset: -1 | 1) => {
      if (isSavingOrder) return;
      const index = data.sites.findIndex(
        (site) => site.registeredSiteId === siteId,
      );
      const nextIndex = index + offset;
      if (index < 0 || nextIndex < 0 || nextIndex >= data.sites.length) return;
      const nextIds = data.sites.map((site) => site.registeredSiteId);
      [nextIds[index], nextIds[nextIndex]] = [
        nextIds[nextIndex],
        nextIds[index],
      ];
      void reorderSites(nextIds);
    },
    [data.sites, isSavingOrder, reorderSites],
  );

  const moveSiteBefore = useCallback(
    (siteId: string, targetId: string) => {
      if (isSavingOrder) return;
      if (siteId === targetId) return;
      const nextIds = data.sites.map((site) => site.registeredSiteId);
      const sourceIndex = nextIds.indexOf(siteId);
      const targetIndex = nextIds.indexOf(targetId);
      if (sourceIndex < 0 || targetIndex < 0) return;
      nextIds.splice(sourceIndex, 1);
      const adjustedTargetIndex = nextIds.indexOf(targetId);
      const insertionIndex =
        sourceIndex < targetIndex
          ? adjustedTargetIndex + 1
          : adjustedTargetIndex;
      nextIds.splice(insertionIndex, 0, siteId);
      void reorderSites(nextIds);
    },
    [data.sites, isSavingOrder, reorderSites],
  );

  useEffect(() => {
    if (!draggedSiteId) return;
    const onPointerMove = (event: PointerEvent) => {
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-registered-site-id]");
      const targetId = target?.dataset.registeredSiteId ?? null;
      if (targetId && targetId !== draggedSiteId) setDragOverSiteId(targetId);
    };
    const clearDrag = () => {
      setDraggedSiteId(null);
      setDragOverSiteId(null);
    };
    const onPointerUp = () => {
      if (dragOverSiteId) moveSiteBefore(draggedSiteId, dragOverSiteId);
      clearDrag();
    };
    const onPointerCancel = clearDrag;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [dragOverSiteId, draggedSiteId, moveSiteBefore]);

  const renderSiteButton = (site: RegisteredSiteView, closeMobile = false) => {
    const siteIndex = data.sites.findIndex(
      (current) => current.registeredSiteId === site.registeredSiteId,
    );
    return (
      <div
        key={site.registeredSiteId}
        data-registered-site-id={site.registeredSiteId}
        className={`rounded-lg transition-colors ${
          dragOverSiteId === site.registeredSiteId
            ? "border-2 border-sky-400"
            : ""
        }`}
      >
        <div className="flex items-stretch gap-1">
          <button
            type="button"
            onClick={() => {
              selectSite(site.registeredSiteId);
              if (closeMobile) setMobileSitesOpen(false);
            }}
            className={`min-w-0 flex-1 rounded-lg px-2 py-1 text-left transition-colors ${
              site.registeredSiteId === data.selectedSiteId
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <span className="flex min-w-0 items-center gap-1 truncate text-sm font-medium leading-5">
              <span className="truncate">{site.displayName}</span>
              {site.hasNew && (
                <span
                  className="size-2 shrink-0 rounded-full bg-sky-400"
                  aria-hidden="true"
                  title="新着あり"
                />
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs leading-4 opacity-70">
              {site.status === "link"
                ? "リンク登録"
                : site.status === "error"
                  ? "取得失敗"
                  : site.status === "rate-limited"
                    ? "取得制限中"
                    : "フィード"}
            </span>
          </button>
          {sortMode && (
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => moveSite(site.registeredSiteId, -1)}
                disabled={isSavingOrder || siteIndex <= 0}
                aria-label={`${site.displayName}を上へ移動`}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => moveSite(site.registeredSiteId, 1)}
                disabled={
                  isSavingOrder ||
                  siteIndex < 0 ||
                  siteIndex >= data.sites.length - 1
                }
                aria-label={`${site.displayName}を下へ移動`}
              >
                <ArrowDown />
              </Button>
              <button
                type="button"
                tabIndex={0}
                className="touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label={`${site.displayName}をドラッグして移動`}
                onPointerDown={(event) => {
                  if (isSavingOrder) return;
                  event.preventDefault();
                  setDraggedSiteId(site.registeredSiteId);
                  setDragOverSiteId(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                    event.preventDefault();
                    moveSite(
                      site.registeredSiteId,
                      event.key === "ArrowUp" ? -1 : 1,
                    );
                  }
                }}
              >
                <GripVertical />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const siteListControls = (
    <div className="flex shrink-0 flex-wrap items-center gap-2 pb-2 border-b">
      <Button
        variant="outline"
        size="sm"
        aria-pressed={newOnly}
        aria-label="新着のみ"
        className={newOnly ? "text-accent-foreground" : ""}
        onClick={() => {
          const nextNewOnly = !newOnly;
          setNewOnly(nextNewOnly);
          setSiteListPage(0);
          if (nextNewOnly) {
            setSortMode(false);
            setDraggedSiteId(null);
            setDragOverSiteId(null);
          }
        }}
      >
        <ListFilter />
        新着のみ
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const nextSortMode = !sortMode;
          setSortMode(nextSortMode);
          setDraggedSiteId(null);
          setDragOverSiteId(null);
          if (nextSortMode) setNewOnly(false);
        }}
        aria-pressed={sortMode}
        aria-label={sortMode ? "並べ替え完了" : "並べ替え"}
        disabled={data.sites.length < 2 || isSavingOrder}
        className={sortMode ? "text-accent-foreground" : ""}
      >
        <ChevronsUpDown />
        {sortMode ? "並べ替え完了" : "並べ替え"}
      </Button>
    </div>
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
            <Card className="h-full min-h-0 w-full py-2">
              <CardContent className="flex min-h-0 w-full flex-1 flex-col gap-2 p-2">
                <p className="px-1 pb-1 text-sm leading-4 font-medium text-muted-foreground">
                  登録先 ({filteredSites.length}/{data.sites.length})
                </p>
                {siteListControls}
                <div
                  ref={setSiteListElement}
                  className="min-h-0 flex-1 space-y-2 overflow-y-auto scrollbar-readable"
                >
                  {visibleSites.length > 0 ? (
                    visibleSites.map((site) => renderSiteButton(site))
                  ) : (
                    <p className="px-2 py-3 text-sm text-muted-foreground">
                      新着記事のある登録先はありません
                    </p>
                  )}
                </div>
                {siteListPageCount > 1 && (
                  <div className="flex shrink-0 items-center justify-between gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
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
                      size="icon-sm"
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
              <Card className="gap-0 py-2">
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
                    <div className="px-3 pb-2">{siteListControls}</div>
                    {filteredSites.length > 0 ? (
                      filteredSites.map((site) => renderSiteButton(site, true))
                    ) : (
                      <p className="px-2 py-3 text-sm text-muted-foreground">
                        新着記事のある登録先はありません
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <section
              ref={articleScrollRef}
              className="min-w-0 space-y-5 md:h-full md:overflow-y-auto md:pr-2 scrollbar-readable"
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
                    <a
                      href={selectedSite.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block break-all text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {selectedSite.siteUrl}
                    </a>
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
