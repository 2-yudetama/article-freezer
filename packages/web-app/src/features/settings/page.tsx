"use client";

import { useSettings } from "@/features/settings/hooks/use-settings";
import SettingsPageView from "@/features/settings/ui/page-view";

/** 設定ページを表示する関数 */
export default function SettingsPage() {
  const settings = useSettings();

  return <SettingsPageView {...settings} />;
}
