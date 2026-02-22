import { getLogger } from "@logtape/logtape";
import { notFound, redirect } from "next/navigation";
import type React from "react";
import * as v from "valibot";
import {
  DesktopNavigation,
  MobileNavigation,
} from "@/components/navigation/navigation";
import { UserIdProvider } from "@/components/providers/user-id-provider";
import { auth } from "@/lib/auth";

/**
 * ログインユーザに対して以下のチェックを行う(結果は全て子コンポーネントに引き継がれる)
 * - userIdの型チェック(UUID)
 * - ユーザのリソース権限チェック
 * - ユーザのロールチェック(一時的に利用ユーザを制限するため)
 */
export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  // LogTapeのロガー作成
  const logger = getLogger(["web-app", "users"]);

  const { userId } = await params;

  // userIdの型チェック(UUID)
  const result = v.safeParse(v.pipe(v.string(), v.uuid()), userId);
  if (!result.success) {
    logger.error(`Invalid userId: ${new v.ValiError(result.issues).message}`);
    return notFound();
  }

  const session = await auth();
  if (!session) {
    return redirect("/auth/signin");
  }

  // セッションからユーザ情報を取得
  const user = session.user;
  if (!user.id) {
    return notFound();
  }

  // ログインしているユーザに関連しないリソースへのアクセスを禁止
  if (userId !== user.id) {
    return notFound();
  }

  // 暫定的に、roleが1以外のユーザはアクセス制限をかける
  if (user.role !== 1) {
    return redirect("/users/forbidden");
  }

  // チェック通過で子コンポーネントをレンダリング
  return (
    <UserIdProvider userId={userId}>
      <DesktopNavigation />
      <MobileNavigation />
      <main className="md:ml-64 min-h-screen pb-16 md:pb-0 pt-16 md:pt-0">
        {children}
      </main>
    </UserIdProvider>
  );
}
