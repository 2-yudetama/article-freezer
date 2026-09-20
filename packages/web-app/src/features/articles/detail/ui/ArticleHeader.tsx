"use client";

import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Article } from "@/domain/articles";

type ArticleHeaderProps = {
  userId: string;
  article?: Article;
  deleteDialogOpen?: boolean;
  onDeleteDialogOpenChange?: (open: boolean) => void;
  deleteError?: string | null;
  isDeleting?: boolean;
  onDelete?: () => void | Promise<void>;
};

/** 記事詳細ページのヘッダーを表示する関数 */
export default function ArticleHeader({
  userId,
  article,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  deleteError,
  isDeleting = false,
  onDelete,
}: ArticleHeaderProps) {
  const canShowArticleActions =
    article !== undefined &&
    deleteDialogOpen !== undefined &&
    onDeleteDialogOpenChange !== undefined &&
    onDelete !== undefined;

  return (
    <>
      <header className="py-4 flex items-center justify-between border-b border-border">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/users/${userId}/articles`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            一覧に戻る
          </Link>
        </Button>
        {canShowArticleActions && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/users/${userId}/articles/${article.articleId}/edit`}
              >
                <Edit className="w-4 h-4 mr-2" />
                編集
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => onDeleteDialogOpenChange(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              削除
            </Button>
          </div>
        )}
      </header>

      {canShowArticleActions && (
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={onDeleteDialogOpenChange}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。記事を完全に削除してもよろしいですか？
              </AlertDialogDescription>
              {deleteError && (
                <p className="text-destructive text-sm" role="alert">
                  {deleteError}
                </p>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                キャンセル
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault();
                  void onDelete?.();
                }}
              >
                {isDeleting ? "削除中…" : "削除"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
