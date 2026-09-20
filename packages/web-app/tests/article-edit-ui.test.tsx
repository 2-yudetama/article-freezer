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
vi.mock("@/components/markdown-preview", () => ({
  MarkdownPreview: ({ content }: { content: string }) => (
    <div data-testid="markdown-preview">{content}</div>
  ),
}));

import { useArticleEdit } from "@/features/articles/edit/hooks/use-article-edit";
import ArticleEditPageView from "@/features/articles/edit/ui/ArticleEditPageView";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ARTICLE_ID = "22222222-2222-4222-8222-222222222222";
const article: Article = {
  articleId: ARTICLE_ID,
  userId: USER_ID,
  articleSource: {
    type: "url",
    url: "https://example.com/article",
  },
  title: "編集前のタイトル",
  publishedDate: null,
  content: "# 編集前の本文",
  isFavorite: true,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
  tags: [],
};

let root: Root | null = null;
let container: HTMLDivElement;

function Harness() {
  const state = useArticleEdit({ userId: USER_ID, article });
  return (
    <ArticleEditPageView
      userId={state.userId}
      article={state.article}
      title={state.title}
      content={state.content}
      error={state.error}
      isSaving={state.isSaving}
      onTitleChange={state.setTitle}
      onContentChange={state.setContent}
      onSave={state.handleSave}
      onCancel={state.handleCancel}
    />
  );
}

async function settle() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

function button(name: string): HTMLButtonElement {
  const element = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === name,
  );
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`ボタンが見つかりません: ${name}`);
  }
  return element;
}

function link(name: string): HTMLAnchorElement {
  const element = Array.from(container.querySelectorAll("a")).find(
    (candidate) => candidate.textContent?.trim() === name,
  );
  if (!(element instanceof HTMLAnchorElement)) {
    throw new Error(`リンクが見つかりません: ${name}`);
  }
  return element;
}

function field<T extends HTMLInputElement | HTMLTextAreaElement>(
  id: string,
): T {
  const element = container.querySelector(`#${id}`);
  if (
    !(element instanceof HTMLInputElement) &&
    !(element instanceof HTMLTextAreaElement)
  ) {
    throw new Error(`入力欄が見つかりません: ${id}`);
  }
  return element as T;
}

async function fillField(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  await act(async () => {
    const prototype =
      element instanceof HTMLInputElement
        ? HTMLInputElement.prototype
        : HTMLTextAreaElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      "value",
    )?.set;
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
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
});

async function mount() {
  root = createRoot(container);
  await act(async () => {
    root?.render(<Harness />);
  });
}

describe("記事編集 UI", () => {
  it("DBから渡された記事を表示し、初期状態では Markdown プレビューを描画しない", async () => {
    await mount();

    expect(field<HTMLInputElement>("title").value).toBe("編集前のタイトル");
    expect(field<HTMLTextAreaElement>("content").value).toBe("# 編集前の本文");
    expect(
      container.querySelector('[data-testid="markdown-preview"]'),
    ).toBeNull();
    expect(
      field<HTMLTextAreaElement>("content").getAttribute("aria-labelledby"),
    ).toBe("content-heading");
    expect(field<HTMLInputElement>("url").disabled).toBe(true);
    expect(container.textContent).not.toContain("お気に入り");
    expect(container.textContent).not.toContain("タグ");
  });

  it("プレビューを開くと最新本文を表示し、閉じると描画を破棄する", async () => {
    await mount();
    await fillField(field<HTMLTextAreaElement>("content"), "## 編集後の本文");

    expect(
      container.querySelector('[data-testid="markdown-preview"]'),
    ).toBeNull();

    await act(async () => {
      button("プレビューを表示").click();
    });

    expect(
      container.querySelector('[data-testid="markdown-preview"]')?.textContent,
    ).toBe("## 編集後の本文");

    await act(async () => {
      button("プレビューを閉じる").click();
    });

    expect(
      container.querySelector('[data-testid="markdown-preview"]'),
    ).toBeNull();
  });

  it("キャンセルでは API を呼ばず詳細へ戻る", async () => {
    await mount();

    await act(async () => {
      button("キャンセル").click();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith(
      `/users/${USER_ID}/articles/${ARTICLE_ID}`,
    );
  });

  it("詳細に戻るリンクでは保存処理を呼び出さない", async () => {
    await mount();
    const detailLink = link("詳細に戻る");
    detailLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });

    await act(async () => {
      detailLink.click();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("保存中の二重送信を防ぎ、成功後に詳細を更新する", async () => {
    let resolveRequest: (response: Response) => void = () => {};
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    fetchMock.mockReturnValueOnce(pendingRequest);

    await mount();
    await fillField(field<HTMLInputElement>("title"), "更新後のタイトル");
    await fillField(field<HTMLTextAreaElement>("content"), "## 更新後の本文");

    await act(async () => {
      button("保存").click();
      button("保存").click();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/users/${USER_ID}/articles/${ARTICLE_ID}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "更新後のタイトル",
          content: "## 更新後の本文",
        }),
      },
    );
    expect(button("保存中…").disabled).toBe(true);
    expect(button("キャンセル").disabled).toBe(true);

    resolveRequest(new Response(null, { status: 204 }));
    await settle();

    expect(toast.success).toHaveBeenCalledWith("記事を保存しました");
    expect(router.push).toHaveBeenCalledWith(
      `/users/${USER_ID}/articles/${ARTICLE_ID}`,
    );
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it("保存に失敗した場合は入力値を保持し、再試行できる", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ name: "Error", message: "保存に失敗しました" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await mount();
    await fillField(field<HTMLInputElement>("title"), "編集済みタイトル");
    await fillField(field<HTMLTextAreaElement>("content"), "編集済みの本文");
    await act(async () => {
      button("保存").click();
    });
    await settle();

    expect(field<HTMLInputElement>("title").value).toBe("編集済みタイトル");
    expect(field<HTMLTextAreaElement>("content").value).toBe("編集済みの本文");
    expect(container.textContent).toContain("保存に失敗しました");
    expect(toast.error).toHaveBeenCalledWith("記事を保存できませんでした", {
      description: "保存に失敗しました",
    });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await act(async () => {
      button("保存").click();
    });
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      `/api/users/${USER_ID}/articles/${ARTICLE_ID}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "編集済みタイトル",
          content: "編集済みの本文",
        }),
      },
    );
    expect(router.push).toHaveBeenCalledWith(
      `/users/${USER_ID}/articles/${ARTICLE_ID}`,
    );
  });

  it("ネットワークエラー時は入力値を保持してエラーを表示する", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network unavailable"));

    await mount();
    await act(async () => {
      button("保存").click();
    });
    await settle();

    expect(container.textContent).toContain(DEFAULT_ERROR_MESSAGE);
    expect(field<HTMLInputElement>("title").value).toBe(article.title);
    expect(field<HTMLTextAreaElement>("content").value).toBe(article.content);
  });
});
