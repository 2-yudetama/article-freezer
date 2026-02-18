import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useUserId } from "@/components/providers/user-id-provider";
import { mockTags } from "@/lib/mock-data";
import type { RegistrationStep } from "@/lib/types";

type Heading = {
  id: string;
  level: number;
  text: string;
  selected: boolean;
};

type UseArticleRegistrationResult = {
  userId: string;
  step: RegistrationStep;
  url: string;
  headings: Heading[];
  selectedTags: string[];
  comment: string;
  summary: string;
  summaryRetryCount: number;
  isLoading: boolean;
  steps: RegistrationStep[];
  currentStepIndex: number;
  progress: number;
  setUrl: (value: string) => void;
  setComment: (value: string) => void;
  setSummary: (value: string) => void;
  setStep: (value: RegistrationStep) => void;
  setIsLoading: (value: boolean) => void;
  setSummaryRetryCount: (value: number) => void;
  setSelectedTags: (value: string[]) => void;
  setHeadings: (value: Heading[]) => void;
  handleUrlSubmit: () => Promise<void>;
  handleHeadingsSubmit: () => void;
  handleTagsCommentSubmit: () => void;
  handleRegenerate: () => Promise<void>;
  handleSummarySubmit: () => void;
  handleSave: () => Promise<void>;
  toggleHeading: (id: string) => void;
  toggleTag: (tagId: string) => void;
  availableTags: typeof mockTags;
};

export function useArticleRegistration(): UseArticleRegistrationResult {
  const router = useRouter();
  const userId = useUserId();

  const [step, setStep] = useState<RegistrationStep>("url");
  const [url, setUrl] = useState("");
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryRetryCount, setSummaryRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const steps: RegistrationStep[] = useMemo(
    () => ["url", "headings", "tags-comment", "summary", "confirm"],
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
    setHeadings([
      { id: "1", level: 1, text: "はじめに", selected: true },
      { id: "2", level: 2, text: "背景と課題", selected: false },
      { id: "3", level: 2, text: "解決策の提案", selected: true },
      { id: "4", level: 3, text: "技術選定", selected: false },
      { id: "5", level: 3, text: "実装方法", selected: true },
      { id: "6", level: 2, text: "まとめ", selected: true },
    ]);
    setIsLoading(false);
    setStep("headings");
  };

  const handleHeadingsSubmit = () => {
    const hasSelected = headings.some((h) => h.selected);
    if (!hasSelected) {
      toast.info("確認", {
        description: "見出しが選択されていませんが、このまま進みますか?",
      });
    }
    setStep("tags-comment");
  };

  const generateSummary = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSummary(
      "この記事では、最新のWebフレームワークを使用した開発手法について詳しく解説しています。特に、サーバーサイドレンダリングとクライアントサイドレンダリングの適切な使い分けや、パフォーマンス最適化のテクニックに焦点を当てています。実践的なコード例とともに、プロダクション環境での運用ノウハウも紹介されています。",
    );
    setIsLoading(false);
  };

  const handleTagsCommentSubmit = () => {
    if (selectedTags.length === 0) {
      toast.info("確認", {
        description: "タグが選択されていませんが、このまま進みますか?",
      });
    }
    setStep("summary");
    generateSummary();
  };

  const handleRegenerate = async () => {
    if (summaryRetryCount >= 3) {
      toast.error("エラー", {
        description: "要約の再生成は3回までです",
      });
      return;
    }
    setSummaryRetryCount((prev) => prev + 1);
    await generateSummary();
  };

  const handleSummarySubmit = () => {
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

  const toggleHeading = (id: string) => {
    setHeadings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, selected: !h.selected } : h)),
    );
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
    headings,
    selectedTags,
    comment,
    summary,
    summaryRetryCount,
    isLoading,
    steps,
    currentStepIndex,
    progress,
    setUrl,
    setComment,
    setSummary,
    setStep,
    setIsLoading,
    setSummaryRetryCount,
    setSelectedTags,
    setHeadings,
    handleUrlSubmit,
    handleHeadingsSubmit,
    handleTagsCommentSubmit,
    handleRegenerate,
    handleSummarySubmit,
    handleSave,
    toggleHeading,
    toggleTag,
    availableTags: mockTags,
  };
}
