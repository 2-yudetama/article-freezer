import { useState } from "react";
import { toast } from "sonner";
import { useUserId } from "@/components/providers/user-id-provider";
import { mockArticles, mockTags } from "@/lib/mock-data";

type UseArticleTagsResult = {
  userId: string;
  tags: typeof mockTags;
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

export function useArticleTags(): UseArticleTagsResult {
  const userId = useUserId();
  const [tags, setTags] = useState(mockTags);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getArticleCountForTag = (tagId: string) => {
    return mockArticles.filter((article) =>
      article.tags.some((tag) => tag.id === tagId),
    ).length;
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      toast.error("エラー", {
        description: "タグ名を入力してください",
      });
      return;
    }

    setTags((prev) => {
      const nextId = Math.max(0, ...prev.map((t) => Number(t.id) || 0)) + 1;
      const newTag = {
        id: String(nextId),
        name: newTagName,
        description: newTagDescription,
      };
      return [...prev, newTag];
    });
    setNewTagName("");
    setNewTagDescription("");
    setIsDialogOpen(false);

    toast.success("タグを追加しました", {
      description: `「${newTagName}」が追加されました`,
    });
  };

  const handleEditTag = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      setEditingId(tagId);
      setEditingName(tag.name);
      setEditingDescription(tag.description || "");
    }
  };

  const handleSaveEdit = (tagId: string) => {
    if (!editingName.trim()) {
      toast.error("エラー", {
        description: "タグ名を入力してください",
      });
      return;
    }

    setTags(
      tags.map((t) =>
        t.id === tagId
          ? { ...t, name: editingName, description: editingDescription }
          : t,
      ),
    );
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");

    toast.success("タグを更新しました");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");
  };

  const handleDeleteTag = (tagId: string) => {
    const articleCount = getArticleCountForTag(tagId);

    if (articleCount > 0) {
      toast.error("削除できません", {
        description: `このタグは${articleCount}件の記事で使用されています`,
      });
      return;
    }

    const tag = tags.find((t) => t.id === tagId);
    setTags(tags.filter((t) => t.id !== tagId));

    toast.success("タグを削除しました", {
      description: `「${tag?.name}」が削除されました`,
    });
  };

  return {
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
  };
}
