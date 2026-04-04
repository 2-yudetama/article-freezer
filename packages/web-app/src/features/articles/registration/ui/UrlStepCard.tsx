"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UrlStepCardProps = {
  url: string;
  isLoading: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

/**
 * 記事 URL の入力と抽出開始を担当するステップ。
 */
export default function UrlStepCard({
  url,
  isLoading,
  onUrlChange,
  onSubmit,
}: UrlStepCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>記事のURLを入力</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://example.com/articles/react-server-components"
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                取得中
              </>
            ) : (
              <>
                次へ
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
