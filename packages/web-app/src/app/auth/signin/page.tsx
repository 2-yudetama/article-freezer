"use client";
import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function SignIn() {
  useEffect(() => {
    signIn(undefined, { redirectTo: "/articles" });
  }, []);
  return <div>リダイレクト中...</div>;
}
