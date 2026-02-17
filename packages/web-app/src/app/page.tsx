import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    return redirect("/auth/signin");
  }

  // セッションからユーザ情報を取得
  const user = session.user;
  if (!user.id) {
    return notFound();
  }

  redirect(`/users/${user.id}/articles`);
}
