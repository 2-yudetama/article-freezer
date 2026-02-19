"use client";

import { Check, Edit2, Plus, Tag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ArticleTagsPageViewProps = {
  userId: string;
  tags: {
    id: string;
    name: string;
    description?: string;
    color?: string;
  }[];
  editingId: string | null;
  editingName: string;
  editingDescription: string;
  newTagName: string;
  newTagDescription: string;
  isDialogOpen: boolean;
  setEditingName: (value: string) => void;
  setEditingDescription: (value: string) => void;
  setNewTagName: (value: string) => void;
  setNewTagDescription: (value: string) => void;
  setIsDialogOpen: (value: boolean) => void;
  getArticleCountForTag: (tagId: string) => number;
  handleAddTag: () => void;
  handleEditTag: (tagId: string) => void;
  handleSaveEdit: (tagId: string) => void;
  handleCancelEdit: () => void;
  handleDeleteTag: (tagId: string) => void;
};

/** 記事タグページのUIを表示する関数 */
export default function ArticleTagsPageView({
  userId,
  tags,
  editingId,
  editingName,
  editingDescription,
  newTagName,
  newTagDescription,
  isDialogOpen,
  setEditingName,
  setEditingDescription,
  setNewTagName,
  setNewTagDescription,
  setIsDialogOpen,
  getArticleCountForTag,
  handleAddTag,
  handleEditTag,
  handleSaveEdit,
  handleCancelEdit,
  handleDeleteTag,
}: ArticleTagsPageViewProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">タグ管理</h1>
          <p className="text-muted-foreground">
            {tags.length}個のタグが登録されています
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新規タグ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいタグを追加</DialogTitle>
              <DialogDescription>
                記事を分類するための新しいタグを作成します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-tag-name">タグ名</Label>
                <Input
                  id="new-tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="例: React"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-tag-description">概要（任意）</Label>
                <Input
                  id="new-tag-description"
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  placeholder="例: Reactライブラリに関する記事"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAddTag}>追加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => {
          const articleCount = getArticleCountForTag(tag.id);
          const isEditing = editingId === tag.id;

          return (
            <Card
              key={tag.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  {isEditing ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="タグ名"
                        autoFocus
                      />
                      <Input
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        placeholder="概要（任意）"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveEdit(tag.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color || "#8c5cff" }}
                      />
                      <CardTitle className="text-lg">{tag.name}</CardTitle>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveEdit(tag.id)}
                        aria-label="タグを保存"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        aria-label="編集をキャンセル"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTag(tag.id)}
                        aria-label="タグを編集"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTag(tag.id)}
                        disabled={articleCount > 0}
                        aria-label="タグを削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <CardDescription className="mt-2">
                    {tag.description || `${articleCount}件の記事`}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {articleCount > 0 ? (
                  <Link href={`/users/${userId}/articles?tag=${tag.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                    >
                      記事を表示
                    </Button>
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    まだ記事がありません
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tags.length === 0 && (
        <Card className="p-12 text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">タグがありません</h3>
          <p className="text-muted-foreground mb-4">
            新しいタグを作成して記事を整理しましょう
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                最初のタグを作成
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しいタグを追加</DialogTitle>
                <DialogDescription>
                  記事を分類するための新しいタグを作成します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-tag-name-empty">タグ名</Label>
                  <Input
                    id="new-tag-name-empty"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="例: React"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-tag-description">概要（任意）</Label>
                  <Input
                    id="new-tag-description"
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    placeholder="例: Reactライブラリに関する記事"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  キャンセル
                </Button>
                <Button onClick={handleAddTag}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      )}
    </div>
  );
}
