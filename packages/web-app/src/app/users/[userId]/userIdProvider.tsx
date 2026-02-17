"use client";

import { createContext, type PropsWithChildren, useContext } from "react";

// Contextを使用して型チェック済みのuserIdを子コンポーネントで使用可能にする
const ctx = createContext<string | null>(null);

export function UserIdProvider({
  userId,
  children,
}: PropsWithChildren<{
  userId: string;
}>) {
  return <ctx.Provider value={userId}>{children}</ctx.Provider>;
}

/**
 * userIdを取得するカスタムフック
 */
/** @lintignore */
export function useUserId(): string {
  const value = useContext(ctx);
  if (value === null) {
    throw new Error(
      "UserIdProvider is missing. Wrap the component tree with <UserIdProvider>.",
    );
  }

  return value;
}
