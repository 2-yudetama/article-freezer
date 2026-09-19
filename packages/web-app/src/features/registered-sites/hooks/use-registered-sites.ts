"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/response.shared";
import type {
  RegisteredSitePageData,
  RegisteredSiteStatus,
} from "../common/types";

type LoadMode = "initial" | "page" | "refresh";

type LoadOptions = {
  siteId: string | null;
  cursor: string | null;
  mode: LoadMode;
  replaceUrl?: boolean;
  since?: string;
  accessStartedAt?: string;
};

function buildQuery({
  siteId,
  cursor,
  since,
  accessStartedAt,
  mode,
}: {
  siteId: string | null;
  cursor: string | null;
  since: string;
  accessStartedAt: string;
  mode: "initial" | "page";
}) {
  const query = new URLSearchParams({ since, accessStartedAt });
  if (siteId) query.set("siteId", siteId);
  if (cursor) query.set("cursor", cursor);
  if (mode === "page") query.set("mode", "page");
  return query.toString();
}

function updateHistoryUrl({
  pathname,
  siteId,
  cursor,
  since,
  accessStartedAt,
  mode,
  replace,
}: {
  pathname: string;
  siteId: string | null;
  cursor: string | null;
  since: string;
  accessStartedAt: string;
  mode: "initial" | "page";
  replace: boolean;
}) {
  const query = buildQuery({
    siteId,
    cursor,
    since,
    accessStartedAt,
    mode,
  });
  const url = query ? `${pathname}?${query}` : pathname;
  window.history[replace ? "replaceState" : "pushState"]({}, "", url);
  return new URL(url, window.location.origin).search;
}

function statusFromError(status: number): RegisteredSiteStatus {
  return status === 429 ? "rate-limited" : "error";
}

export function useRegisteredSites(
  props: RegisteredSitePageData & { userId: string },
) {
  const { userId, ...initialData } = props;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const initialCursor = searchParams.get("cursor");
  const initialSiteId = searchParams.get("siteId");
  const [data, setData] = useState(initialData);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>(
    initialCursor ? [null, initialCursor] : [null],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const latestRequestId = useRef(0);
  const handledUrlRef = useRef(searchKey);
  const accessRecordAttemptRef = useRef<string | null>(null);
  const cursorStaleHandledRef = useRef(false);
  const refreshAttemptRef = useRef<string | null>(null);

  const selectedSite = data.sites.find(
    (site) => site.registeredSiteId === data.selectedSiteId,
  );
  const currentCursor = cursorHistory.at(-1) ?? null;
  const retryAt = selectedSite?.fetchNotBefore
    ? new Date(selectedSite.fetchNotBefore).getTime()
    : null;
  const remainingSeconds = retryAt
    ? Math.max(0, Math.ceil((retryAt - now) / 1000))
    : 0;

  useEffect(() => {
    if (!retryAt || retryAt <= Date.now()) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= retryAt) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);

  const recordAccess = useCallback(
    async (pageData: RegisteredSitePageData) => {
      if (
        !pageData.displaySucceeded ||
        pageData.accessRecorded ||
        accessRecordAttemptRef.current === pageData.accessStartedAt
      ) {
        return;
      }
      accessRecordAttemptRef.current = pageData.accessStartedAt;
      try {
        const response = await fetch(
          `/api/users/${userId}/registered-sites/access`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessStartedAt: pageData.accessStartedAt,
              displayed: pageData.displaySucceeded,
            }),
          },
        );
        if (!response.ok) throw new Error("access record failed");
        const result = (await response.json()) as { recorded?: boolean };
        if (result.recorded) {
          setData((current) =>
            current.accessStartedAt === pageData.accessStartedAt
              ? { ...current, accessRecorded: true }
              : current,
          );
        }
      } catch {
        accessRecordAttemptRef.current = null;
      }
    },
    [userId],
  );

  const load = useCallback(
    async ({
      siteId,
      cursor,
      mode,
      replaceUrl = false,
      since = data.accessBaseline,
      accessStartedAt = data.accessStartedAt,
    }: LoadOptions) => {
      const requestId = ++latestRequestId.current;
      setIsLoading(true);
      const queryMode = mode === "page" ? "page" : "initial";
      const query = buildQuery({
        siteId,
        cursor,
        since,
        accessStartedAt,
        mode: queryMode,
      });
      const endpoint =
        mode === "refresh" && siteId
          ? `/api/users/${userId}/registered-sites/${siteId}/refresh?${query}`
          : `/api/users/${userId}/registered-sites?${query}`;

      try {
        const response = await fetch(endpoint, {
          method: mode === "refresh" && siteId ? "POST" : "GET",
        });
        if (requestId !== latestRequestId.current) return;

        if (!response.ok) {
          if (response.status === 404 && siteId) {
            await load({
              siteId: null,
              cursor: null,
              mode: "initial",
              replaceUrl: true,
              since,
              accessStartedAt,
            });
            return;
          }
          if (response.status === 409) {
            toast.info("一覧が更新されました。先頭から読み直します");
            await load({
              siteId,
              cursor: null,
              mode: "page",
              replaceUrl: true,
              since,
              accessStartedAt,
            });
            return;
          }
          const errorBody = (await response.json().catch(() => null)) as {
            message?: string;
            retryAt?: string;
          } | null;
          if (requestId !== latestRequestId.current) return;
          const message = errorBody?.message ?? "登録サイトを取得できません";
          setData((current) => ({
            ...current,
            sites: current.sites.map((site) =>
              site.registeredSiteId === siteId
                ? {
                    ...site,
                    status: statusFromError(response.status),
                    ...(errorBody?.retryAt
                      ? { fetchNotBefore: errorBody.retryAt }
                      : {}),
                    errorMessage: message,
                  }
                : site,
            ),
            errorMessage: message,
          }));
          toast.error("登録サイトを取得できません", {
            description: message,
          });
          return;
        }

        const nextData = (await response.json()) as RegisteredSitePageData;
        if (requestId !== latestRequestId.current) return;
        setData(nextData);
        if (mode === "page" || mode === "refresh") {
          setCursorHistory((history) => {
            if (!cursor) return [null];
            const cursorIndex = history.indexOf(cursor);
            return cursorIndex >= 0
              ? history.slice(0, cursorIndex + 1)
              : [null, cursor];
          });
        } else {
          setCursorHistory([null]);
        }
        const nextCursor = mode === "initial" ? null : cursor;
        const nextUrlMode = nextCursor ? "page" : "initial";
        const nextSearch = updateHistoryUrl({
          pathname,
          siteId: nextData.selectedSiteId,
          cursor: nextCursor,
          since: nextData.accessBaseline,
          accessStartedAt: nextData.accessStartedAt,
          mode: nextUrlMode,
          replace: replaceUrl,
        });
        handledUrlRef.current = nextSearch.slice(1);
        void recordAccess(nextData);
      } catch {
        if (requestId !== latestRequestId.current) return;
        setData((current) => ({
          ...current,
          sites: current.sites.map((site) =>
            site.registeredSiteId === siteId
              ? {
                  ...site,
                  status: "error",
                  errorMessage: "通信に失敗しました。再試行してください",
                }
              : site,
          ),
          errorMessage: "通信に失敗しました。再試行してください",
        }));
        toast.error("登録サイトを取得できません", {
          description: "通信に失敗しました。再試行してください",
        });
      } finally {
        if (requestId === latestRequestId.current) setIsLoading(false);
      }
    },
    [data.accessBaseline, data.accessStartedAt, pathname, recordAccess, userId],
  );

  useEffect(() => {
    if (props.cursorStale && !cursorStaleHandledRef.current) {
      cursorStaleHandledRef.current = true;
      toast.info("一覧が更新されました。先頭から読み直します");
      void load({
        siteId: initialSiteId,
        cursor: null,
        mode: "page",
        replaceUrl: true,
      });
      return;
    }
    if (data.displaySucceeded && !data.accessRecorded) {
      void recordAccess(data);
    }
  }, [data, initialSiteId, load, props.cursorStale, recordAccess]);

  useEffect(() => {
    if (
      !data.selectedSiteId ||
      selectedSite?.status !== "loading" ||
      !selectedSite.feedUrl
    ) {
      return;
    }
    const refreshKey = `${data.selectedSiteId}:${data.accessStartedAt}:${
      data.cacheVersion ?? "none"
    }`;
    if (refreshAttemptRef.current === refreshKey) return;
    refreshAttemptRef.current = refreshKey;
    void load({
      siteId: data.selectedSiteId,
      cursor: currentCursor,
      mode: "refresh",
      replaceUrl: true,
    });
  }, [
    currentCursor,
    data.accessStartedAt,
    data.cacheVersion,
    data.selectedSiteId,
    load,
    selectedSite?.feedUrl,
    selectedSite?.status,
  ]);

  useEffect(() => {
    const loadFromUrl = (nextSearch: string) => {
      const params = new URLSearchParams(nextSearch);
      const siteId = params.get("siteId");
      const cursor = params.get("cursor");
      const mode = params.get("mode") === "page" || cursor ? "page" : "initial";
      if (handledUrlRef.current === nextSearch) return;
      handledUrlRef.current = nextSearch;
      void load({
        siteId,
        cursor,
        mode,
        replaceUrl: true,
        since: params.get("since") ?? undefined,
        accessStartedAt: params.get("accessStartedAt") ?? undefined,
      });
    };
    const onPopState = () => loadFromUrl(window.location.search.slice(1));
    window.addEventListener("popstate", onPopState);
    if (handledUrlRef.current !== searchKey) loadFromUrl(searchKey);
    return () => window.removeEventListener("popstate", onPopState);
  }, [load, searchKey]);

  const selectSite = (siteId: string) => {
    void load({ siteId, cursor: null, mode: "initial" });
  };

  const refresh = () => {
    if (data.selectedSiteId && selectedSite?.feedUrl) {
      void load({
        siteId: data.selectedSiteId,
        cursor: currentCursor,
        mode: "refresh",
        replaceUrl: true,
      });
    }
  };

  const removeSite = async () => {
    if (!data.selectedSiteId || !selectedSite) return;
    if (
      !window.confirm(`「${selectedSite.displayName}」の登録を解除しますか？`)
    )
      return;
    const requestId = ++latestRequestId.current;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/users/${userId}/registered-sites/${data.selectedSiteId}`,
        { method: "DELETE" },
      );
      if (requestId !== latestRequestId.current) return;
      if (!response.ok) {
        toast.error("登録を解除できません", {
          description: await getApiErrorMessage(response),
        });
        return;
      }
      toast.success("登録サイトを解除しました");
      await load({
        siteId: null,
        cursor: null,
        mode: "initial",
        replaceUrl: true,
      });
    } catch {
      if (requestId !== latestRequestId.current) return;
      toast.error("登録を解除できません", {
        description: "通信に失敗しました。再試行してください",
      });
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false);
    }
  };

  const goNext = () => {
    if (!data.selectedSiteId || !data.nextCursor) return;
    void load({
      siteId: data.selectedSiteId,
      cursor: data.nextCursor,
      mode: "page",
    });
  };

  const goPrevious = () => {
    if (!data.selectedSiteId || cursorHistory.length <= 1) return;
    const previousHistory = cursorHistory.slice(0, -1);
    const previousCursor = previousHistory.at(-1) ?? null;
    void load({
      siteId: data.selectedSiteId,
      cursor: previousCursor,
      mode: "page",
    });
  };

  return {
    data,
    selectedSite,
    cursorHistory,
    isLoading,
    remainingSeconds,
    selectSite,
    refresh,
    removeSite,
    goNext,
    goPrevious,
    reload: () =>
      void load({
        siteId: null,
        cursor: null,
        mode: "initial",
        replaceUrl: true,
      }),
  };
}
