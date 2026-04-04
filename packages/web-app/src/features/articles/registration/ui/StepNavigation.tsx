"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type StepNavigationProps = {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
};

/**
 * ステップ画面共通の前後移動ボタン。
 * 各ステップ固有の文言差分だけ props で受け取る。
 */
export default function StepNavigation({
  onBack,
  onNext,
  nextLabel = "次へ",
  backLabel = "戻る",
}: StepNavigationProps) {
  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {backLabel}
      </Button>
      <Button onClick={onNext}>
        {nextLabel}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
