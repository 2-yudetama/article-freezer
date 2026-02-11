import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  session: {
    strategy: "jwt",
    maxAge: 86400, // 1 day
  },
  callbacks: {
    authorized: ({ request, auth }) => {
      // URLからオリジンとパスを取得
      const origin = request.nextUrl.origin;
      const pathname = request.nextUrl.pathname;

      // 認証不要のページへのアクセスは許可
      const allowedPaths = ["/auth/signin", "/auth/notfound"];
      if (allowedPaths.some((path) => pathname.startsWith(path))) {
        return true;
      }

      // セッションのないユーザはログインページにリダイレクト
      if (!auth?.user) {
        // アクセスしたURLをコールバックに登録する
        const redirectUrl = new URL("/auth/signin", origin);
        redirectUrl.searchParams.set("callbackUrl", pathname);

        return Response.redirect(redirectUrl);
      }

      return true;
    },
  },
});
