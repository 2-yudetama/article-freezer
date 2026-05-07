"use client";

import { Eye, FileEdit, Loader2, Pencil, Save, X } from "lucide-react";
import { forwardRef } from "react";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ARTICLE_COMMENT_MAX_LENGTH, type Article } from "@/domain/articles";
import { formatDateTimeInTokyo } from "@/lib/utils/data-format";

type ArticleCommentProps = {
  comment: Article["comment"];
  isEditing: boolean;
  value: string;
  error: string | null;
  isSaving: boolean;
  onChange: (value: string) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
};

/** 記事コメントを表示する関数 */
const ArticleComment = forwardRef<HTMLDivElement, ArticleCommentProps>(
  function ArticleComment(
    {
      comment,
      isEditing,
      value,
      error,
      isSaving,
      onChange,
      onEdit,
      onCancel,
      onSave,
    },
    ref,
  ) {
    const hasComment = Boolean(comment?.comment);
    const updatedAtLabel = comment
      ? formatDateTimeInTokyo(comment.updatedAt)
      : null;
    const remainingLength = ARTICLE_COMMENT_MAX_LENGTH - value.length;
    const isOverLimit = remainingLength < 0;
    const previewContent = value.trim() || "プレビューする内容がありません";

    return (
      <section ref={ref} id="article-comment" className="scroll-mt-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>コメント</span>
              <Badge variant="outline" className="text-xs font-normal">
                あなたの感想
              </Badge>
            </h2>
            {updatedAtLabel ? (
              <p className="text-sm text-muted-foreground">
                更新日時：{updatedAtLabel}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                コメントはまだ登録されていません
              </p>
            )}
          </div>
          {!isEditing && (
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
              {hasComment ? "コメントを編集" : "コメントを追加"}
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Tabs defaultValue="edit">
              <TabsList className="grid w-full grid-cols-2 md:w-80">
                <TabsTrigger value="edit">
                  <FileEdit className="w-4 h-4 mr-2" />
                  編集
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="w-4 h-4 mr-2" />
                  プレビュー
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-4">
                <Textarea
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  className="min-h-40 font-mono text-sm placeholder:text-sm md:text-sm md:placeholder:text-sm leading-normal"
                  placeholder="マークダウン記法が使用できます"
                  rows={6}
                  aria-invalid={Boolean(error) || isOverLimit}
                  disabled={isSaving}
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <MarkdownPreview
                  content={previewContent}
                  cardClassName="min-h-40"
                  contentClassName={
                    value.trim()
                      ? "min-h-40"
                      : "min-h-40 flex items-center justify-center p-12 text-center text-muted-foreground"
                  }
                />
              </TabsContent>
            </Tabs>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p
                  className={
                    isOverLimit
                      ? "text-sm text-destructive"
                      : "text-sm text-muted-foreground"
                  }
                >
                  残り{remainingLength}文字
                </p>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                  キャンセル
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving || isOverLimit || !value.trim()}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "保存中" : "保存"}
                </Button>
              </div>
            </div>
          </div>
        ) : hasComment ? (
          <div className="border-l-4 border-primary">
            <MarkdownPreview
              content={comment?.comment ?? ""}
              cardClassName="rounded-none"
            />
          </div>
        ) : (
          <div className="border border-dashed p-6 text-sm text-muted-foreground">
            記事についての感想やメモを追加できます
          </div>
        )}
      </section>
    );
  },
);

export default ArticleComment;
