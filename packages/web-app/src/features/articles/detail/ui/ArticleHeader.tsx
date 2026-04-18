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
  onDelete?: () => void;
};

/** 記事詳細ページのヘッダーを表示する関数 */
export default function ArticleHeader({
  userId,
  article,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
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
        <Link href={`/users/${userId}/articles`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            一覧に戻る
          </Button>
        </Link>
        {canShowArticleActions && (
          <div className="flex items-center gap-2">
            <Link href={`/users/${userId}/articles/${article.articleId}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                編集
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
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
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>削除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
