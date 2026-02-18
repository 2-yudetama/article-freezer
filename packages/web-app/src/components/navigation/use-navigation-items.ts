"use client";

import type { LucideIcon } from "lucide-react";
import { BookOpen, Settings, Tags } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUserId } from "@/components/providers/user-id-provider";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export type NavigationItemsResult = {
  navItems: NavigationItem[];
  pathname: string;
  registrationHref: string;
};

export function useNavigationItems(): NavigationItemsResult {
  const pathname = usePathname();
  const userId = useUserId();
  const navItems = [
    { href: `/users/${userId}/articles`, icon: BookOpen, label: "記事一覧" },
    { href: `/users/${userId}/article-tags`, icon: Tags, label: "タグ管理" },
    { href: `/users/${userId}/settings`, icon: Settings, label: "設定" },
  ];

  return {
    navItems,
    pathname,
    registrationHref: `/users/${userId}/articles/registration`,
  };
}
