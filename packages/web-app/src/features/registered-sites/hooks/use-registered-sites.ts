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
  deepLink?: boolean;
  resetHistory?: boolean;
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
  mode,
  replace,
}: {
  pathname: string;
  siteId: string | null;
  cursor: string | null;
  mode: "initial" | "page";
  replace: boolean;
}) {
  const query = new URLSearchParams();
  if (siteId) query.set("siteId", siteId);
  if (cursor) query.set("cursor", cursor);
  if (mode === "page") query.set("mode", "page");
  const queryString = query.toString();
  const url = queryString ? `${pathname}?${queryString}` : pathname;
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
  const [cursorState, setCursorState] = useState<{
    history: Array<string | null>;
    position: number;
  }>({
    history: initialCursor ? [initialCursor] : [null],
    position: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const accessSessionRef = useRef({
    accessBaseline: initialData.accessBaseline,
    accessStartedAt: initialData.accessStartedAt,
  });
  const accessRecordedRef = useRef(initialData.accessRecorded);
  const latestRequestId = useRef(0);
  const handledUrlRef = useRef(searchKey);
  const accessRecordAttemptRef = useRef<string | null>(null);
  const cursorStaleHandledRef = useRef(false);
  const refreshAttemptRef = useRef<string | null>(null);
  const deepLinkRef = useRef(Boolean(initialCursor));
  const normalizedUrlRef = useRef(false);
  const skipInitialUrlEffectRef = useRef(true);
  const cacheVersionRef = useRef(initialData.cacheVersion);
  const selectedSiteIdRef = useRef(initialData.selectedSiteId);

  const selectedSite = data.sites.find(
    (site) => site.registeredSiteId === data.selectedSiteId,
  );
  const cursorHistory = cursorState.history;
  const cursorPosition = cursorState.position;
  const currentCursor = cursorHistory[cursorPosition] ?? null;
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
          accessRecordedRef.current = true;
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
      deepLink = false,
      resetHistory = false,
    }: LoadOptions) => {
      const requestId = ++latestRequestId.current;
      setIsLoading(true);
      const queryMode = mode === "page" ? "page" : "initial";
      const { accessBaseline, accessStartedAt } = accessSessionRef.current;
      const query = buildQuery({
        siteId,
        cursor,
        since: accessBaseline,
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
              resetHistory: true,
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

        const responseData = (await response.json()) as RegisteredSitePageData;
        if (requestId !== latestRequestId.current) return;
        const nextData: RegisteredSitePageData = {
          ...responseData,
          accessBaseline: accessSessionRef.current.accessBaseline,
          accessStartedAt: accessSessionRef.current.accessStartedAt,
          accessRecorded:
            accessRecordedRef.current || responseData.accessRecorded,
        };
        const siteChanged =
          selectedSiteIdRef.current !== responseData.selectedSiteId;
        const generationChanged =
          mode === "refresh" &&
          Boolean(cacheVersionRef.current) &&
          Boolean(responseData.cacheVersion) &&
          cacheVersionRef.current !== responseData.cacheVersion;
        if (generationChanged && cursor) {
          await load({
            siteId,
            cursor: null,
            mode: "page",
            replaceUrl: true,
            resetHistory: true,
          });
          return;
        }
        cacheVersionRef.current = responseData.cacheVersion;
        selectedSiteIdRef.current = responseData.selectedSiteId;
        setData(nextData);
        if (mode === "page" || mode === "refresh") {
          setCursorState((state) => {
            if (resetHistory || siteChanged || generationChanged) {
              deepLinkRef.current = false;
              if (cursor) {
                deepLinkRef.current = deepLink;
                return { history: [cursor], position: 0 };
              }
              return { history: [null], position: 0 };
            }
            if (!cursor) {
              deepLinkRef.current = false;
              const firstPage = state.history.indexOf(null);
              return firstPage >= 0
                ? { ...state, position: firstPage }
                : { history: [null], position: 0 };
            }
            const cursorIndex = state.history.indexOf(cursor);
            if (cursorIndex >= 0) {
              return { ...state, position: cursorIndex };
            }
            deepLinkRef.current = deepLink || deepLinkRef.current;
            const history = [
              ...state.history.slice(0, state.position + 1),
              cursor,
            ];
            return { history, position: history.length - 1 };
          });
        } else {
          deepLinkRef.current = false;
          setCursorState({ history: [null], position: 0 });
        }
        const nextCursor = mode === "initial" ? null : cursor;
        const nextSearch = updateHistoryUrl({
          pathname,
          siteId: nextData.selectedSiteId,
          cursor: nextCursor,
          mode: "page",
          replace: replaceUrl,
        });
        handledUrlRef.current = nextSearch.slice(1);
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
    [pathname, userId],
  );

  useEffect(() => {
    if (normalizedUrlRef.current) return;
    normalizedUrlRef.current = true;
    const nextSearch = updateHistoryUrl({
      pathname,
      siteId: initialSiteId,
      cursor: initialCursor,
      mode: "page",
      replace: true,
    });
    handledUrlRef.current = nextSearch.slice(1);
  }, [initialCursor, initialSiteId, pathname]);

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
    if (skipInitialUrlEffectRef.current) {
      skipInitialUrlEffectRef.current = false;
      return;
    }
    const loadFromUrl = (nextSearch: string) => {
      const params = new URLSearchParams(nextSearch);
      const siteId = params.get("siteId");
      const cursor = params.get("cursor");
      const mode = params.get("mode") === "initial" ? "initial" : "page";
      if (handledUrlRef.current === nextSearch) return;
      handledUrlRef.current = nextSearch;
      void load({
        siteId,
        cursor,
        mode,
        replaceUrl: true,
        deepLink: Boolean(cursor && !cursorHistory.includes(cursor)),
      });
    };
    const onPopState = () => loadFromUrl(window.location.search.slice(1));
    window.addEventListener("popstate", onPopState);
    if (handledUrlRef.current !== searchKey) loadFromUrl(searchKey);
    return () => window.removeEventListener("popstate", onPopState);
  }, [cursorHistory, load, searchKey]);

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
    if (!data.selectedSiteId || cursorPosition <= 0) return;
    const previousCursor = cursorHistory[cursorPosition - 1] ?? null;
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
    cursorPosition,
    isDeepLink: deepLinkRef.current,
    isLoading,
    remainingSeconds,
    selectSite,
    refresh,
    removeSite,
    goNext,
    goPrevious,
    reload: (registeredSiteId?: string) =>
      void load({
        siteId: registeredSiteId ?? null,
        cursor: null,
        mode: "initial",
        replaceUrl: true,
      }),
  };
}
