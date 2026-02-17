"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-8rem)] md:min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-xl text-center">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl">アクセス権限がありません</CardTitle>
          <CardDescription>
            アプリを利用する権限がないため、サインアウトします。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Button
            type="button"
            onClick={() => signOut({ redirectTo: "/auth/signin" })}
          >
            サインアウト
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
