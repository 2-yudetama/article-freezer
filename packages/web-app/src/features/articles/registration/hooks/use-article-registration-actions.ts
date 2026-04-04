"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mockExtractedArticles } from "@/lib/mock-data";
import { REGISTRATION_STEP_ORDER, type RegistrationStep } from "../domain";

type Params = {
  userId: string;
  step: RegistrationStep;
  url: string;
  extractedArticle: (typeof mockExtractedArticles)[number] | null;
  setStep: (value: RegistrationStep) => void;
  setExtractedArticle: (
    value: (typeof mockExtractedArticles)[number] | null,
  ) => void;
  setSelectedTags: (value: string[] | ((prev: string[]) => string[])) => void;
  setIsLoading: (value: boolean) => void;
};

/**
 * 記事登録フローの副作用とステップ遷移を管理する。
 * state 自体は持たず、必要な setter を受け取って操作だけを担当する。
 */
export function useArticleRegistrationActions({
  userId,
  step,
  url,
  extractedArticle,
  setStep,
  setExtractedArticle,
  setSelectedTags,
  setIsLoading,
}: Params) {
  const router = useRouter();
  const orderedSteps = Object.entries(REGISTRATION_STEP_ORDER)
    .sort(([, leftOrder], [, rightOrder]) => leftOrder - rightOrder)
    .map(([registrationStep]) => registrationStep as RegistrationStep);

  const moveToNextStep = () => {
    const nextStep = orderedSteps[REGISTRATION_STEP_ORDER[step] + 1];

    if (nextStep) {
      setStep(nextStep);
    }
  };

  const moveToPreviousStep = () => {
    const previousStep = orderedSteps[REGISTRATION_STEP_ORDER[step] - 1];

    if (previousStep) {
      setStep(previousStep);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) {
      toast.error("エラー", {
        description: "URLを入力してください",
      });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // 実 API 接続前のため、入力 URL に対応するモックを解決して利用する。
    const matchedArticle =
      mockExtractedArticles.find((article) => article.url === url) ??
      mockExtractedArticles[0];
    setExtractedArticle(matchedArticle);
    setIsLoading(false);
    moveToNextStep();
  };

  const handleExtractedArticleSubmit = () => {
    if (!extractedArticle) {
      toast.error("エラー", {
        description: "抽出結果がありません",
      });
      return;
    }

    moveToNextStep();
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    toast.success("登録完了", {
      description: "記事が正常に登録されました",
    });
    router.push(`/users/${userId}/articles`);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  return {
    moveToNextStep,
    moveToPreviousStep,
    handleUrlSubmit,
    handleExtractedArticleSubmit,
    handleSave,
    toggleTag,
  };
}
