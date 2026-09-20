/** @vitest-environment jsdom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Article } from "@/domain/articles";
import { DEFAULT_ERROR_MESSAGE } from "@/lib/api/response.shared";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));
const fetchMock = vi.hoisted(() => vi.fn<typeof fetch>());
const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/link", () => ({ default: "a" }));
vi.mock("sonner", () => ({ toast }));

import { useArticleDetail } from "@/features/articles/detail/hooks/use-article-detail";
import ArticleHeader from "@/features/articles/detail/ui/ArticleHeader";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ARTICLE_ID = "22222222-2222-4222-8222-222222222222";
const article: Article = {
  articleId: ARTICLE_ID,
  userId: USER_ID,
  articleSource: {
    type: "url",
    url: "https://example.com/article",
  },
  title: "削除対象の記事",
  publishedDate: null,
  content: "本文",
  isFavorite: false,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
  tags: [],
};

let root: Root | null = null;
let container: HTMLDivElement;

function Harness() {
  const state = useArticleDetail({ userId: USER_ID, article });
  return (
    <ArticleHeader
      userId={state.userId}
      article={state.article}
      deleteDialogOpen={state.deleteDialogOpen}
      onDeleteDialogOpenChange={state.setDeleteDialogOpen}
      deleteError={state.deleteError}
      isDeleting={state.isDeleting}
      onDelete={state.handleDelete}
    />
  );
}

async function settle() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

function dialog(): HTMLElement {
  const element = document.querySelector('[role="alertdialog"]');
  if (!(element instanceof HTMLElement)) {
    throw new Error("削除確認ダイアログが見つかりません");
  }
  return element;
}

function button(containerElement: ParentNode, name: string): HTMLButtonElement {
  const element = Array.from(containerElement.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === name,
  );
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`ボタンが見つかりません: ${name}`);
  }
  return element;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  fetchMock.mockReset();
  router.push.mockReset();
  router.refresh.mockReset();
  toast.error.mockReset();
  toast.success.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
    root = null;
  }
  container.remove();
  document.querySelector('[role="alertdialog"]')?.remove();
});

async function mount() {
  root = createRoot(container);
  await act(async () => {
    root?.render(<Harness />);
  });
}

describe("記事削除 UI", () => {
  it("削除確認をキャンセルすると API を呼ばない", async () => {
    await mount();

    await act(async () => {
      button(container, "削除").click();
    });
    expect(dialog()).toBeTruthy();

    await act(async () => {
      button(dialog(), "キャンセル").click();
    });
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      document.querySelector('[role="alertdialog"][data-state="open"]'),
    ).toBeNull();
  });

  it("処理中の二重送信を防ぎ、失敗後は再試行できる", async () => {
    let resolveRequest: (response: Response) => void = () => {};
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    fetchMock.mockReturnValueOnce(pendingRequest);

    await mount();
    await act(async () => {
      button(container, "削除").click();
    });
    const deleteDialog = dialog();
    await act(async () => {
      const deleteButton = button(deleteDialog, "削除");
      deleteButton.click();
      deleteButton.click();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/users/${USER_ID}/articles/${ARTICLE_ID}`,
      { method: "DELETE" },
    );
    expect(button(dialog(), "削除中…").disabled).toBe(true);
    expect(button(dialog(), "キャンセル").disabled).toBe(true);

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    await settle();
    expect(
      document.querySelector('[role="alertdialog"][data-state="open"]'),
    ).not.toBeNull();

    resolveRequest(
      new Response(
        JSON.stringify({ name: "Error", message: "削除に失敗しました" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    await settle();

    expect(dialog().textContent).toContain("削除に失敗しました");
    expect(toast.error).toHaveBeenCalledWith("記事を削除できませんでした", {
      description: "削除に失敗しました",
    });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await act(async () => {
      button(dialog(), "削除").click();
    });
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith("記事を削除しました", {
      description: article.title,
    });
    expect(router.push).toHaveBeenCalledWith(`/users/${USER_ID}/articles`);
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it("ネットワークエラーを表示し、失敗後に再試行できる", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network unavailable"));

    await mount();
    await act(async () => {
      button(container, "削除").click();
    });
    await act(async () => {
      button(dialog(), "削除").click();
    });
    await settle();

    expect(dialog().textContent).toContain(DEFAULT_ERROR_MESSAGE);
    expect(toast.error).toHaveBeenCalledWith("記事を削除できませんでした", {
      description: DEFAULT_ERROR_MESSAGE,
    });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await act(async () => {
      button(dialog(), "削除").click();
    });
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(router.push).toHaveBeenCalledWith(`/users/${USER_ID}/articles`);
  });
});
