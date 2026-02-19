"use client";

import { Download, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

type SettingsPageViewProps = {
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

/** 設定ページのUIを表示する関数 */
export default function SettingsPageView({
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
}: SettingsPageViewProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">設定</h1>
        <p className="text-muted-foreground">
          アプリケーションの動作をカスタマイズします
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>表示設定</CardTitle>
            <CardDescription>記事一覧の表示方法を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>デフォルト表示形式</Label>
                <p className="text-sm text-muted-foreground">
                  記事一覧ページの初期表示形式
                </p>
              </div>
              <Select value={defaultView} onValueChange={setDefaultView}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">グリッド</SelectItem>
                  <SelectItem value="list">リスト</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>1ページあたりの表示件数</Label>
                <p className="text-sm text-muted-foreground">
                  一度に表示する記事の数
                </p>
              </div>
              <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6件</SelectItem>
                  <SelectItem value="9">9件</SelectItem>
                  <SelectItem value="12">12件</SelectItem>
                  <SelectItem value="24">24件</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>機能設定</CardTitle>
            <CardDescription>
              アプリケーションの機能を設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-summary">自動要約生成</Label>
                <p className="text-sm text-muted-foreground">
                  記事登録時に自動で要約を生成します
                </p>
              </div>
              <Switch
                id="auto-summary"
                checked={autoSummary}
                onCheckedChange={setAutoSummary}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications">通知</Label>
                <p className="text-sm text-muted-foreground">
                  新しい記事の追加などを通知します
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>データ管理</CardTitle>
            <CardDescription>記事データのバックアップと復元</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                データをエクスポート
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={handleImport}
              >
                <Upload className="w-4 h-4 mr-2" />
                データをインポート
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-destructive">危険な操作</Label>
              <p className="text-sm text-muted-foreground">
                すべての記事とタグを削除します。この操作は取り消せません。
              </p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDeleteAll}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                すべてのデータを削除
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>アプリケーション情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">バージョン</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">最終更新日</span>
              <span>2024年1月</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            <Save className="w-4 h-4 mr-2" />
            設定を保存
          </Button>
        </div>
      </div>
    </div>
  );
}
