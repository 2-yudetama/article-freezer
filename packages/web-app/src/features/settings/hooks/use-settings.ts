import { useState } from "react";
import { toast } from "sonner";

type UseSettingsResult = {
  autoSummary: boolean;
  defaultView: string;
  itemsPerPage: string;
  notifications: boolean;
  setAutoSummary: (value: boolean) => void;
  setDefaultView: (value: string) => void;
  setItemsPerPage: (value: string) => void;
  setNotifications: (value: boolean) => void;
  handleSave: () => void;
  handleExport: () => void;
  handleImport: () => void;
  handleDeleteAll: () => void;
};

export function useSettings(): UseSettingsResult {
  const [autoSummary, setAutoSummary] = useState(true);
  const [defaultView, setDefaultView] = useState("grid");
  const [itemsPerPage, setItemsPerPage] = useState("9");
  const [notifications, setNotifications] = useState(false);

  const handleSave = () => {
    toast.success("設定を保存しました", {
      description: "変更内容が保存されました",
    });
  };

  const handleExport = () => {
    toast.success("エクスポート完了", {
      description: "データをダウンロードしました",
    });
  };

  const handleImport = () => {
    toast.success("インポート完了", {
      description: "データをインポートしました",
    });
  };

  const handleDeleteAll = () => {
    if (confirm("すべてのデータを削除しますか?この操作は取り消せません。")) {
      toast.success("データを削除しました", {
        description: "すべての記事とタグが削除されました",
      });
    }
  };

  return {
    autoSummary,
    defaultView,
    itemsPerPage,
    notifications,
    setAutoSummary,
    setDefaultView,
    setItemsPerPage,
    setNotifications,
    handleSave,
    handleExport,
    handleImport,
    handleDeleteAll,
  };
}
