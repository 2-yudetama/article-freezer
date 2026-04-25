"use client";

import { DesktopNavigationView } from "@/components/navigation/desktop";
import { MobileNavigationView } from "@/components/navigation/mobile";
import { useNavigationItems } from "@/components/navigation/use-navigation-items";

/**
 * デスクトップ表示用のナビゲーション
 */
export function DesktopNavigation() {
  const { navItems, pathname } = useNavigationItems();
  return <DesktopNavigationView navItems={navItems} pathname={pathname} />;
}

/**
 * モバイル表示用のナビゲーション
 */
export function MobileNavigation() {
  const { navItems, pathname } = useNavigationItems();
  return <MobileNavigationView navItems={navItems} pathname={pathname} />;
}
