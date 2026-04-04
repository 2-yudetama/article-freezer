import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ArticleTag } from "@/lib/types";
import StepNavigation from "./StepNavigation";

type TagsStepCardProps = {
  availableTags: ArticleTag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onBack: () => void;
  onNext: () => void;
};

/**
 * 記事に紐づけるタグを選択するステップ。
 */
export default function TagsStepCard({
  availableTags,
  selectedTags,
  onToggleTag,
  onBack,
  onNext,
}: TagsStepCardProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>タグを選択</CardTitle>
          <CardDescription>
            記事の内容に関連するタグを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Button
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleTag(tag.id)}
              >
                {tag.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <StepNavigation onBack={onBack} onNext={onNext} />
    </div>
  );
}
