import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export const config = {
  // ?!で否定となるため、下記に指定したものはプロキシが実行されない
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export const proxy = auth((request: NextRequest) => {
  // x-middleware-subrequest を含むリクエストはブロック
  if (request.headers.has("x-middleware-subrequest")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // セキュリティに関するヘッダーを設定
  const response = NextResponse.next();

  /**
   * X-DNSプリフェッチ制御
   * https://nextjs.org/docs/app/api-reference/config/next-config-js/headers#x-dns-prefetch-control
   */
  response.headers.set("X-DNS-Prefetch-Control", "on");

  /**
   * X-Frameオプション
   * https://nextjs.org/docs/app/api-reference/config/next-config-js/headers#x-frame-options
   */
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  /**
   * パーミッションポリシー
   * https://nextjs.org/docs/app/api-reference/config/next-config-js/headers#permissions-policy
   */
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );

  /**
   * X-Content-Type-Options
   * https://nextjs.org/docs/app/api-reference/config/next-config-js/headers#x-content-type-options
   */
  response.headers.set("X-Content-Type-Options", "nosniff");

  /**
   * リファラーポリシー
   * https://nextjs.org/docs/app/api-reference/config/next-config-js/headers#x-content-type-options
   */
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
});
