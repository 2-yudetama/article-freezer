import { getLogger } from "@logtape/logtape";
import { prisma } from "db";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { authLogger } from "@/lib/auth/logger";

// LogTapeのロガー作成
const logger = getLogger(["web-app", "auth"]);

export const { handlers, auth } = NextAuth({
  providers: [GitHub],
  session: {
    strategy: "jwt",
    maxAge: 86400, // 1 day
  },
  logger: authLogger(),
  callbacks: {
    /**
     * Authorizedコールバック
     * @see https://authjs.dev/reference/nextjs#authorized
     */
    authorized: ({ request, auth }) => {
      // URLからオリジンとパスを取得
      const origin = request.nextUrl.origin;
      const pathname = request.nextUrl.pathname;

      // 認証不要のページへのアクセスは許可
      const allowedPaths = [
        "/auth/signin",
        "/auth/notfound",
        "/users/forbidden",
      ];
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

      // ログインしているユーザに関連しないリソースへのアクセスを禁止
      if (pathname.startsWith("/users/")) {
        // パスからuserIdを取得
        const userId = pathname.split("/").filter(Boolean)[1];
        if (userId !== auth.user.id) {
          logger.warn(
            "[Auth] Unauthorized user access to other user's resource",
            {
              user_id: auth.user.id,
              target_user_id: userId,
              pathname,
            },
          );
          return Response.redirect(new URL("/auth/notfound", origin));
        }
      }

      return true;
    },
    /**
     * SignInコールバック
     * @see https://authjs.dev/reference/nextjs#signin
     */
    signIn: async ({ user, account }) => {
      if (!user || !account) {
        logger.error("[Auth] User or Account is missing");
        return false;
      }

      try {
        // ユーザ情報をDBにupsert
        const dbUser = await prisma.user.upsert({
          where: {
            provider_provider_account_id: {
              provider: account.provider,
              provider_account_id: account.providerAccountId,
            },
          },
          create: {
            provider: account.provider,
            provider_account_id: account.providerAccountId,
            name: user.name ?? "unknown",
            email: user.email ?? "unknown",
            image: user.image ?? "unknown",
          },
          update: {
            name: user.name ?? "unknown",
            email: user.email ?? "unknown",
            image: user.image ?? "unknown",
          },
        });

        // 必要な情報を代入
        user.id = dbUser.user_id;
        user.provider = dbUser.provider;
        user.provider_account_id = dbUser.provider_account_id;
        user.role = dbUser.role;

        logger.info("[Auth] Upsert user successfully; User: {user_id}", {
          user_id: user.id,
        });
        return true;
      } catch (error) {
        // DBエラーは認証エラーとする
        logger.error(
          "[Auth] DB upsert error: {error.name}",
          error instanceof Error ? error : new Error("unknown error"),
        );
        return false;
      }
    },
    /**
     * JWTコールバック
     * @see https://authjs.dev/reference/nextjs#jwt
     */
    jwt: ({ token, user, account }) => {
      // サインイン直後はuserとaccountを持つ
      if (user && account) {
        // jwt作成
        return {
          ...token,
          id: user.id,
          sub: user.id,
          provider: user.provider,
          provider_account_id: user.provider_account_id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      }

      /**
       * NOTE: jwtコールバックがアクセスされるたびにセッションの期限が更新される
       * @see https://github.com/nextauthjs/next-auth/issues/13248
       */
      return token;
    },
    /**
     * Sessionコールバック
     * @see https://authjs.dev/reference/nextjs#session
     */
    session: ({ session, token }) => {
      // tokenの情報で更新して返す
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          provider: token.provider,
          provider_account_id: token.provider_account_id,
          name: token.name,
          email: token.email,
          image: token.image,
          role: token.role,
        },
      };
    },
  },
});
