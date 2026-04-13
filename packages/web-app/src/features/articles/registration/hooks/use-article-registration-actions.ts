"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as v from "valibot";
import type {
  ArticleExtractResponse,
  ArticleRegistrationRequest,
} from "@/features/articles/shared/api";
import {
  DEFAULT_ERROR_MESSAGE,
  getApiErrorMessage,
} from "@/lib/api/response.shared";
import { mockTags } from "@/lib/mock-data";
import {
  REGISTRATION_STEP_ORDER,
  type RegistrationArticleSource,
  RegistrationArticleSourceSchema,
  RegistrationCommentSchema,
  RegistrationExtractedArticleSchema,
  type RegistrationStep,
} from "../common";

type Params = {
  userId: string;
  step: RegistrationStep;
  url: string;
  extractedArticle: ArticleExtractResponse | null;
  comment: string;
  selectedTags: string[];
  setStep: (value: RegistrationStep) => void;
  setUrl: (value: string) => void;
  setExtractedArticle: (value: ArticleExtractResponse | null) => void;
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

  /** 記事抽出 API にリクエストを送る */
  const requestArticleExtraction = async (
    payload: RegistrationArticleSource,
    onSuccess?: () => void,
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/articles/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        showError(await getApiErrorMessage(response));
        return;
      }

      setExtractedArticle(await response.json());
      onSuccess?.();
    } catch {
      showError(DEFAULT_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
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
  ): ArticleRegistrationRequest => {
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

    const validatedUrl = result.output.articleSource.url;
    setUrl(validatedUrl);

    // 抽出済みURLと入力URLが同じ場合はリクエストをスキップ
    if (extractedArticle?.articleSource.url === validatedUrl) {
      moveToNextStep();
      return;
    }

    await requestArticleExtraction(result.output, moveToNextStep);
  };

  /** URL が同じ場合でも抽出リクエストを再実行する */
  const handleReExtract = async () => {
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

    setUrl(result.output.articleSource.url);
    await requestArticleExtraction(result.output, () => {
      toast.success("再抽出完了", {
        description: "記事本文を再取得しました",
      });
    });
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

    if (!validateSelectedTags(selectedTags)) {
      return;
    }

    const payload = buildRegistrationPayload(extractedArticle);

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/users/${userId}/articles/registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        showError(await getApiErrorMessage(response));
        return;
      }

      toast.success("登録完了", {
        description: "記事が正常に登録されました",
      });
      router.push(`/users/${userId}/articles`);
    } catch {
      showError(DEFAULT_ERROR_MESSAGE);
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
    handleReExtract,
    handleExtractedArticleSubmit,
    handleCommentSubmit,
    handleTagsSubmit,
    handleSave,
    toggleTag,
  };
}
