"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as v from "valibot";
import { mockExtractedArticles, mockTags } from "@/lib/mock-data";
import {
  REGISTRATION_STEP_ORDER,
  RegistrationArticleSourceSchema,
  RegistrationCommentSchema,
  RegistrationExtractedArticleSchema,
  RegistrationSaveSchema,
  type RegistrationStep,
} from "../domain";

type Params = {
  userId: string;
  step: RegistrationStep;
  url: string;
  extractedArticle: (typeof mockExtractedArticles)[number] | null;
  comment: string;
  selectedTags: string[];
  setStep: (value: RegistrationStep) => void;
  setUrl: (value: string) => void;
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
  comment,
  selectedTags,
  setStep,
  setUrl,
  setExtractedArticle,
  setSelectedTags,
  setIsLoading,
}: Params) {
  const router = useRouter();
  const orderedSteps = Object.entries(REGISTRATION_STEP_ORDER)
    .sort(([, leftOrder], [, rightOrder]) => leftOrder - rightOrder)
    .map(([registrationStep]) => registrationStep as RegistrationStep);

  /** 現在ステップの次にあるステップへ進める。 */
  const moveToNextStep = () => {
    const nextStep = orderedSteps[REGISTRATION_STEP_ORDER[step] + 1];

    if (nextStep) {
      setStep(nextStep);
    }
  };

  /** 現在ステップのひとつ前に戻す。 */
  const moveToPreviousStep = () => {
    const previousStep = orderedSteps[REGISTRATION_STEP_ORDER[step] - 1];

    if (previousStep) {
      setStep(previousStep);
    }
  };

  /** ステップ固有の入力エラーをトースト表示する。 */
  const showValidationError = (description: string) => {
    toast.error("入力エラー", {
      description,
    });
  };

  /** 業務ルール違反などの通常エラーをトースト表示する。 */
  const showError = (description: string) => {
    toast.error("エラー", {
      description,
    });
  };

  /** 選択されたタグ ID の存在確認と重複確認を行う。 */
  const validateSelectedTags = (tagIds: string[]) => {
    const availableTagIds = new Set(mockTags.map((tag) => tag.id));
    const hasInvalidTag = tagIds.some((tagId) => !availableTagIds.has(tagId));

    if (hasInvalidTag) {
      toast.error("入力エラー", {
        description: "存在しないタグが選択されています",
      });
      return false;
    }

    if (new Set(tagIds).size !== tagIds.length) {
      toast.error("入力エラー", {
        description: "タグが重複しています",
      });
      return false;
    }

    return true;
  };

  /** 保存前検証に使う登録内容の payload を現在 state から組み立てる。 */
  const buildRegistrationPayload = (
    article: NonNullable<typeof extractedArticle>,
  ) => {
    const normalizedComment = comment.trim();

    return {
      article: {
        articleSource: {
          type: "url" as const,
          url: url.trim(),
        },
        title: article.title,
        publishedDate: article.publishedDate,
        content: article.content,
      },
      comment: normalizedComment ? { comment: normalizedComment } : undefined,
      selectedTagIds: selectedTags,
    };
  };

  /** URL ステップの入力を検証し、抽出結果ステップへ進める。 */
  const handleUrlSubmit = async () => {
    const normalizedUrl = url.trim();
    const result = v.safeParse(RegistrationArticleSourceSchema, {
      articleSource: {
        type: "url",
        url: normalizedUrl,
      },
    });

    if (!result.success) {
      showValidationError("URLを正しい形式で入力してください");
      return;
    }

    const matchedArticle = mockExtractedArticles.find(
      (article) => article.url === normalizedUrl,
    );

    if (!matchedArticle) {
      showError("対応する記事を取得できませんでした");
      return;
    }

    setUrl(result.output.articleSource.url);
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // 実 API 接続前のため、入力 URL に対応するモックを解決して利用する。
      setExtractedArticle(matchedArticle);
      moveToNextStep();
    } finally {
      setIsLoading(false);
    }
  };

  /** 抽出済み記事の内容を検証し、コメント入力ステップへ進める。 */
  const handleExtractedArticleSubmit = () => {
    if (!extractedArticle) {
      showError("抽出結果がありません");
      return;
    }

    const result = v.safeParse(RegistrationExtractedArticleSchema, {
      title: extractedArticle.title,
      publishedDate: extractedArticle.publishedDate,
      content: extractedArticle.content,
    });

    if (!result.success) {
      showValidationError("抽出した記事情報を確認してください");
      return;
    }

    moveToNextStep();
  };

  /** コメント入力を検証し、タグ選択ステップへ進める。 */
  const handleCommentSubmit = () => {
    const normalizedComment = comment.trim();

    if (!normalizedComment) {
      moveToNextStep();
      return;
    }

    const result = v.safeParse(RegistrationCommentSchema, {
      comment: normalizedComment,
    });

    if (!result.success) {
      showValidationError("コメントは1000文字以内で入力してください");
      return;
    }

    moveToNextStep();
  };

  /** タグ選択結果を検証し、確認ステップへ進める。 */
  const handleTagsSubmit = () => {
    if (!validateSelectedTags(selectedTags)) {
      return;
    }

    moveToNextStep();
  };

  /** 登録内容全体を検証したうえで保存処理を実行する。 */
  const handleSave = async () => {
    if (!extractedArticle) {
      showError("抽出結果がありません");
      return;
    }

    const payload = buildRegistrationPayload(extractedArticle);
    const result = v.safeParse(RegistrationSaveSchema, payload);

    if (!result.success) {
      showValidationError("入力内容を確認してください");
      return;
    }

    if (!validateSelectedTags(selectedTags)) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("登録完了", {
        description: "記事が正常に登録されました",
      });
      router.push(`/users/${userId}/articles`);
    } finally {
      setIsLoading(false);
    }
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
    handleCommentSubmit,
    handleTagsSubmit,
    handleSave,
    toggleTag,
  };
}
