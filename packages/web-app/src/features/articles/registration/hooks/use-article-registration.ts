import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useUserId } from "@/components/providers/user-id-provider";
import {
  type ExtractedArticleMock,
  mockExtractedArticles,
  mockTags,
} from "@/lib/mock-data";
import type { RegistrationStep } from "@/lib/types";

type UseArticleRegistrationResult = {
  userId: string;
  step: RegistrationStep;
  url: string;
  extractedArticle: ExtractedArticleMock | null;
  selectedTags: string[];
  comment: string;
  isLoading: boolean;
  steps: RegistrationStep[];
  currentStepIndex: number;
  progress: number;
  setUrl: (value: string) => void;
  setComment: (value: string) => void;
  setStep: (value: RegistrationStep) => void;
  setIsLoading: (value: boolean) => void;
  setSelectedTags: (value: string[]) => void;
  handleUrlSubmit: () => Promise<void>;
  handleExtractedArticleSubmit: () => void;
  handleCommentSubmit: () => void;
  handleTagsSubmit: () => void;
  handleSave: () => Promise<void>;
  toggleTag: (tagId: string) => void;
  availableTags: typeof mockTags;
};

export function useArticleRegistration(): UseArticleRegistrationResult {
  const router = useRouter();
  const userId = useUserId();

  const [step, setStep] = useState<RegistrationStep>("url");
  const [url, setUrl] = useState("");
  const [extractedArticle, setExtractedArticle] =
    useState<ExtractedArticleMock | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const steps: RegistrationStep[] = useMemo(
    () => ["url", "extract-result", "comment", "tags", "confirm"],
    [],
  );
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleUrlSubmit = async () => {
    if (!url) {
      toast.error("エラー", {
        description: "URLを入力してください",
      });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const matchedArticle =
      mockExtractedArticles.find((article) => article.url === url) ??
      mockExtractedArticles[0];
    setExtractedArticle(matchedArticle);
    setIsLoading(false);
    setStep("extract-result");
  };

  const handleExtractedArticleSubmit = () => {
    if (!extractedArticle) {
      toast.error("エラー", {
        description: "抽出結果がありません",
      });
      return;
    }

    setStep("comment");
  };

  const handleCommentSubmit = () => {
    setStep("tags");
  };

  const handleTagsSubmit = () => {
    setStep("confirm");
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
    userId,
    step,
    url,
    extractedArticle,
    selectedTags,
    comment,
    isLoading,
    steps,
    currentStepIndex,
    progress,
    setUrl,
    setComment,
    setStep,
    setIsLoading,
    setSelectedTags,
    handleUrlSubmit,
    handleExtractedArticleSubmit,
    handleCommentSubmit,
    handleTagsSubmit,
    handleSave,
    toggleTag,
    availableTags: mockTags,
  };
}
