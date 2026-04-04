"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type RegistrationLayoutProps = {
  userId: string;
  currentStepIndex: number;
  totalSteps: number;
  children: ReactNode;
};

/**
 * 記事登録画面全体の共通レイアウト。
 * 戻る導線と進捗表示だけを担当し、各ステップの中身は children に委譲する。
 */
export default function RegistrationLayout({
  userId,
  currentStepIndex,
  totalSteps,
  children,
}: RegistrationLayoutProps) {
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href={`/users/${userId}/articles`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            一覧に戻る
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-2">記事を登録</h1>
        <p className="text-muted-foreground">
          ステップ {currentStepIndex + 1} / {totalSteps}
        </p>
      </div>

      <Progress value={progress} className="mb-8" />

      {children}
    </div>
  );
}
