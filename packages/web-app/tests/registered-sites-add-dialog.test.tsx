/** @vitest-environment jsdom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AddRegisteredSiteDialog from "@/features/registered-sites/ui/AddRegisteredSiteDialog";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

const fetchMock = vi.fn<typeof fetch>();
let root: Root | null = null;
let container: HTMLDivElement;
const reactGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
const originalActEnvironment = reactGlobals.IS_REACT_ACT_ENVIRONMENT;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function buttonByText(text: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`ボタンが見つかりません: ${text}`);
  }
  return button;
}

async function click(button: HTMLButtonElement | HTMLInputElement) {
  await act(async () => {
    button.click();
  });
}

async function settle() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

async function setInputValue(input: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    if (!setter) throw new Error("input.value の setter がありません");
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function showDiscovery(result: {
  siteUrl: string;
  siteTitle?: string | null;
  candidates: { feedUrl: string; title: string; format: "rss" | "atom" }[];
}) {
  fetchMock.mockResolvedValueOnce(jsonResponse(result));
  await click(buttonByText("サイトを追加"));
  const urlInput = document.querySelector<HTMLInputElement>(
    "#registered-site-url",
  );
  if (!urlInput) throw new Error("URL 入力欄が見つかりません");
  await setInputValue(urlInput, result.siteUrl);
  await click(buttonByText("フィードを確認"));
  await settle();
}

function displayNameInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(
    "#registered-site-display-name",
  );
  if (!input) throw new Error("表示名入力欄が見つかりません");
  return input;
}

beforeEach(async () => {
  reactGlobals.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  root = createRoot(container);
  await act(async () => {
    root?.render(
      <AddRegisteredSiteDialog userId="user-1" onRegistered={vi.fn()} />,
    );
  });
});

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
    root = null;
  }
  vi.unstubAllGlobals();
  reactGlobals.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
  container.remove();
});

describe("AddRegisteredSiteDialog", () => {
  it("フィード候補の title を初期値とし、候補変更への追従と手入力の保持を行う", async () => {
    await showDiscovery({
      siteUrl: "https://example.com/blog",
      siteTitle: "サイトの title",
      candidates: [
        {
          feedUrl: "https://example.com/feed.xml",
          title: "記事フィード",
          format: "rss",
        },
        {
          feedUrl: "https://example.com/atom.xml",
          title: "更新情報フィード",
          format: "atom",
        },
      ],
    });

    expect(displayNameInput().value).toBe("記事フィード");
    const footerButtons = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-slot="dialog-footer"] button',
      ),
    );
    expect(footerButtons.map((button) => button.textContent?.trim())).toEqual([
      "このフィードを登録",
      "リンクとして登録",
      "キャンセル",
    ]);
    expect(footerButtons[0]?.dataset.variant).toBe("default");
    expect(footerButtons[1]?.dataset.variant).toBe("outline");

    const candidates = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        'input[name="feed-candidate"]',
      ),
    );
    const firstCandidate = candidates[0];
    const secondCandidate = candidates[1];
    if (!firstCandidate || !secondCandidate) {
      throw new Error("2 件のフィード候補が見つかりません");
    }

    await click(secondCandidate);
    expect(displayNameInput().value).toBe("更新情報フィード");

    await setInputValue(displayNameInput(), "手入力した表示名");
    await click(firstCandidate);
    expect(displayNameInput().value).toBe("手入力した表示名");
  });

  it.each([
    {
      siteTitle: "Example のサイト名",
      expectedDisplayName: "Example のサイト名",
    },
    { siteTitle: null, expectedDisplayName: "example.com" },
  ])("フィード候補がない場合は siteTitle またはホスト名を初期値にする", async ({
    siteTitle,
    expectedDisplayName,
  }) => {
    await showDiscovery({
      siteUrl: "https://example.com/blog",
      siteTitle,
      candidates: [],
    });

    expect(displayNameInput().value).toBe(expectedDisplayName);
    expect(buttonByText("リンクとして登録")).toBeTruthy();
  });
});
