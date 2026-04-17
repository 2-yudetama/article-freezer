"use client";

import { useState } from "react";
import type { ArticleExtractResponse } from "@/lib/api/schemas";
import { REGISTRATION_STEP_ORDER, type RegistrationStep } from "../common";

/**
 * 記事登録フローで利用する画面状態をまとめて管理する。
 * ステップ遷移に必要な入力値と進捗表示用の派生値を返す。
 */
export function useArticleRegistrationState() {
  const [step, setStep] = useState<RegistrationStep>("url");
  const [url, setUrl] = useState("");
  const [extractedArticle, setExtractedArticle] =
    useState<ArticleExtractResponse | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 進捗表示は step の順序を正として算出する。
  const currentStepIndex = REGISTRATION_STEP_ORDER[step];
  const totalSteps = Object.keys(REGISTRATION_STEP_ORDER).length;

  return {
    step,
    setStep,
    url,
    setUrl,
    extractedArticle,
    setExtractedArticle,
    selectedTags,
    setSelectedTags,
    comment,
    setComment,
    isLoading,
    setIsLoading,
    currentStepIndex,
    totalSteps,
  };
}
