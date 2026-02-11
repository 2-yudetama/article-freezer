"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  useEffect(() => {
    signIn(undefined, { redirectTo: callbackUrl });
  }, [callbackUrl]);

  return <div>リダイレクト中...</div>;
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <SignInContent />
    </Suspense>
  );
}
