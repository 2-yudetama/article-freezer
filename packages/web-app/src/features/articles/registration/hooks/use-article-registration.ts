"use client";

import { useUserId } from "@/components/providers/user-id-provider";
import { mockTags } from "@/lib/mock-data";
import { useArticleRegistrationActions } from "./use-article-registration-actions";
import { useArticleRegistrationState } from "./use-article-registration-state";

/**
 * 記事登録画面で利用する facade hook。
 * state 管理と副作用を束ね、page から扱いやすい形で公開する。
 */
export function useArticleRegistration() {
  const userId = useUserId();
  const state = useArticleRegistrationState();
  const actions = useArticleRegistrationActions({
    userId,
    step: state.step,
    url: state.url,
    extractedArticle: state.extractedArticle,
    comment: state.comment,
    selectedTags: state.selectedTags,
    setStep: state.setStep,
    setUrl: state.setUrl,
    setExtractedArticle: state.setExtractedArticle,
    setSelectedTags: state.setSelectedTags,
    setIsLoading: state.setIsLoading,
  });

  return {
    userId,
    ...state,
    ...actions,
    availableTags: mockTags,
  };
}
