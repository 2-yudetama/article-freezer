"use client";

import { useArticleRegistration } from "@/features/articles/registration/hooks/use-article-registration";
import CommentStepCard from "@/features/articles/registration/ui/CommentStepCard";
import ConfirmStepCard from "@/features/articles/registration/ui/ConfirmStepCard";
import ExtractResultStepCard from "@/features/articles/registration/ui/ExtractStepCard";
import RegistrationLayout from "@/features/articles/registration/ui/RegistrationLayout";
import TagsStepCard from "@/features/articles/registration/ui/TagsStepCard";
import UrlStepCard from "@/features/articles/registration/ui/UrlStepCard";

/** 記事保存ページを表示する関数 */
export default function ArticleRegistrationPage() {
  const {
    userId,
    step,
    url,
    extractedArticle,
    selectedTags,
    comment,
    isLoading,
    currentStepIndex,
    totalSteps,
    setUrl,
    setComment,
    moveToPreviousStep,
    handleUrlSubmit,
    handleReExtract,
    handleExtractedArticleSubmit,
    handleCommentSubmit,
    handleTagsSubmit,
    handleSave,
    toggleTag,
    availableTags,
  } = useArticleRegistration();

  return (
    <RegistrationLayout
      userId={userId}
      currentStepIndex={currentStepIndex}
      totalSteps={totalSteps}
    >
      {/* 現在ステップに応じて、画面を構成する部品を切り替える。 */}
      {step === "url" && (
        <UrlStepCard
          url={url}
          isLoading={isLoading}
          onUrlChange={setUrl}
          onSubmit={handleUrlSubmit}
        />
      )}

      {step === "extract" && extractedArticle && (
        <ExtractResultStepCard
          url={url}
          extractedArticle={extractedArticle}
          isLoading={isLoading}
          onBack={moveToPreviousStep}
          onReExtract={handleReExtract}
          onNext={handleExtractedArticleSubmit}
        />
      )}

      {step === "comment" && (
        <CommentStepCard
          extractedArticle={extractedArticle}
          comment={comment}
          onCommentChange={setComment}
          onBack={moveToPreviousStep}
          onNext={handleCommentSubmit}
        />
      )}

      {step === "tags" && (
        <TagsStepCard
          availableTags={availableTags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onBack={moveToPreviousStep}
          onNext={handleTagsSubmit}
        />
      )}

      {step === "confirm" && (
        <ConfirmStepCard
          url={url}
          extractedArticle={extractedArticle}
          selectedTags={selectedTags}
          availableTags={availableTags}
          comment={comment}
          isLoading={isLoading}
          onBack={moveToPreviousStep}
          onSave={handleSave}
        />
      )}
    </RegistrationLayout>
  );
}
